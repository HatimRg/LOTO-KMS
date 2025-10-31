/**
 * Universal Database Interface
 * Automatically detects environment and uses:
 * - Electron IPC (when available) for SQLite database
 * - IndexedDB (fallback) for browser/dev mode
 */

import localDB from './localDatabase';

// Detect if IPC is available
const ipcRenderer = window.ipcRenderer || null;
const useElectron = !!ipcRenderer;

if (useElectron) {
  console.log('✅ Using Electron SQLite database');
} else {
  console.log('⚠️  IPC not available - using IndexedDB fallback');
}

export const db = {
  async query(sql, params = []) {
    if (useElectron) {
      return await ipcRenderer.invoke('db-query', sql, params);
    }
    
    // Fallback: Return empty result for now
    // IndexedDB doesn't use SQL queries
    console.warn('SQL query in browser mode - not supported');
    return { success: true, data: [] };
  },

  async run(sql, params = []) {
    if (useElectron) {
      return await ipcRenderer.invoke('db-run', sql, params);
    }
    
    // Fallback: Return success
    console.warn('SQL run in browser mode - not supported');
    return { success: true };
  },

  // Helper to log actions with proper formatting
  async logAction(action, details = null, breakerId = null, user = 'Admin') {
    try {
      await this.addHistory({
        breaker_id: breakerId,
        action: action,
        user: user,
        details: details
      });
    } catch (error) {
      console.error('Failed to log action:', error);
    }
  },

  // Breakers
  async getBreakers(filters = {}) {
    if (!useElectron) {
      // IndexedDB fallback
      return await localDB.query('breakers', filters);
    }

    let sql = 'SELECT * FROM breakers WHERE 1=1';
    const params = [];

    if (filters.zone) {
      sql += ' AND zone = ?';
      params.push(filters.zone);
    }
    if (filters.location) {
      sql += ' AND location = ?';
      params.push(filters.location);
    }
    if (filters.state) {
      sql += ' AND state = ?';
      params.push(filters.state);
    }

    sql += ' ORDER BY zone, location, name';
    return await this.query(sql, params);
  },

  async getLockedBreakers() {
    if (!useElectron) {
      // IndexedDB fallback
      return await localDB.query('breakers', { state: 'Closed' });
    }

    const sql = `
      SELECT * FROM breakers 
      WHERE state = 'Closed' 
      ORDER BY zone, location, name
    `;
    return await this.query(sql);
  },

  async addBreaker(breaker) {
    let result;
    if (!useElectron) {
      // IndexedDB fallback
      result = await localDB.add('breakers', {
        name: breaker.name,
        zone: breaker.zone,
        location: breaker.location,
        state: breaker.state || 'Off',
        lock_key: breaker.lock_key || null,
        general_breaker: breaker.general_breaker || null
      });
    } else {
      const sql = `
        INSERT INTO breakers (name, zone, location, state, lock_key, general_breaker)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      result = await this.run(sql, [
        breaker.name,
        breaker.zone,
        breaker.location,
        breaker.state || 'Off',
        breaker.lock_key || null,
        breaker.general_breaker || null
      ]);
    }

    // Mark lock as used ONLY if lock_key is provided AND breaker is Closed (locked)
    if (result.success && breaker.lock_key && breaker.state === 'Closed') {
      await this.updateLockUsageByKey(breaker.lock_key, true, breaker.name);
      console.log(`🔒 Lock ${breaker.lock_key} marked as in use by new breaker ${breaker.name}`);
    }

    // Log action
    if (result.success) {
      await this.logAction(
        `Added breaker ${breaker.name}`,
        `Zone: ${breaker.zone}, Location: ${breaker.location}, State: ${breaker.state || 'Off'}`,
        result.data?.id
      );
    }

    return result;
  },

  async updateBreaker(id, breaker) {
    // Get old breaker data to compare lock_key changes
    const oldBreakerResult = await this.getBreakers({ id });
    const oldBreaker = oldBreakerResult.success && oldBreakerResult.data?.length > 0 
      ? oldBreakerResult.data[0] 
      : null;

    let result;
    if (!useElectron) {
      // IndexedDB fallback
      result = await localDB.update('breakers', id, {
        name: breaker.name,
        zone: breaker.zone,
        location: breaker.location,
        state: breaker.state,
        lock_key: breaker.lock_key || null,
        general_breaker: breaker.general_breaker || null
      });
    } else {
      const sql = `
        UPDATE breakers 
        SET name = ?, zone = ?, location = ?, state = ?, lock_key = ?, general_breaker = ?, last_updated = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      result = await this.run(sql, [
        breaker.name,
        breaker.zone,
        breaker.location,
        breaker.state,
        breaker.lock_key || null,
        breaker.general_breaker || null,
        id
      ]);
    }

    // Update lock usage status based on lock_key AND state changes
    if (result.success) {
      // Determine if old breaker had lock in use (had lock_key AND was Closed)
      const oldLockInUse = oldBreaker?.lock_key && oldBreaker.state === 'Closed';
      
      // Determine if new breaker has lock in use (has lock_key AND is Closed)
      const newLockInUse = breaker.lock_key && breaker.state === 'Closed';
      
      // Release old lock if:
      // 1. Lock key changed, OR
      // 2. State changed from Closed to something else
      if (oldBreaker?.lock_key && 
          (oldBreaker.lock_key !== breaker.lock_key || (oldLockInUse && !newLockInUse))) {
        await this.updateLockUsageByKey(oldBreaker.lock_key, false);
        console.log(`🔓 Lock ${oldBreaker.lock_key} released from breaker ${breaker.name}`);
      }
      
      // Mark new lock as used ONLY if breaker is Closed (locked)
      if (breaker.lock_key && breaker.state === 'Closed') {
        await this.updateLockUsageByKey(breaker.lock_key, true, breaker.name);
        console.log(`🔒 Lock ${breaker.lock_key} marked as in use by breaker ${breaker.name}`);
      }
    }

    // Log action with state change details and icon type
    if (result.success) {
      let actionType = 'breaker';
      let actionText = '';
      
      if (breaker.state === 'Closed') {
        actionText = `Breaker ${breaker.name} locked`;
        actionType = 'lock';
      } else if (breaker.state === 'On') {
        actionText = `Breaker ${breaker.name} set on`;
      } else {
        actionText = `Breaker ${breaker.name} set off`;
      }
      
      await this.logAction(
        actionText,
        `(${breaker.zone} - ${breaker.location})`,
        id
      );
    }

    return result;
  },

  // Update breaker and cascade to children
  async updateBreakerWithChildren(id, breaker) {
    try {
      // Update the parent breaker
      await this.updateBreaker(id, breaker);

      // If state changed to Off or Closed, cascade to children
      if (breaker.state === 'Off' || breaker.state === 'Closed') {
        const childrenResult = await this.query(
          'SELECT * FROM breakers WHERE general_breaker = ?',
          [id]
        );

        if (childrenResult.success && childrenResult.data) {
          for (const child of childrenResult.data) {
            await this.updateBreaker(child.id, {
              ...child,
              state: breaker.state
            });
          }
          return {
            success: true,
            message: `Updated breaker and ${childrenResult.data.length} children`,
            childrenUpdated: childrenResult.data.length
          };
        }
      }

      return { success: true, message: 'Breaker updated', childrenUpdated: 0 };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async deleteBreaker(id) {
    // Get breaker data before deleting (to release lock if assigned and locked)
    let breakerName = `Breaker #${id}`;
    let lockKey = null;
    let wasLocked = false;
    try {
      const breakers = await this.getBreakers();
      if (breakers.success && breakers.data) {
        const breaker = breakers.data.find(b => b.id === id);
        if (breaker) {
          breakerName = breaker.name;
          lockKey = breaker.lock_key;
          wasLocked = breaker.state === 'Closed';
        }
      }
    } catch (e) {
      console.error('Could not fetch breaker data:', e);
    }

    // Release the lock before deleting the breaker (only if it was actually locked)
    if (lockKey && wasLocked) {
      await this.updateLockUsageByKey(lockKey, false);
      console.log(`🔓 Lock ${lockKey} released from deleted breaker ${breakerName}`);
    }

    let result;
    if (!useElectron) {
      result = await localDB.delete('breakers', id);
    } else {
      result = await this.run('DELETE FROM breakers WHERE id = ?', [id]);
    }

    // Log action
    if (result.success) {
      await this.logAction(`Deleted breaker ${breakerName}`, null, null);
    }

    return result;
  },

  // Locks
  async getLocks(filters = {}) {
    if (!useElectron) {
      // IndexedDB fallback with filtering
      const result = await localDB.getAll('locks');
      if (result.success && result.data) {
        let filtered = result.data;
        
        if (filters.zone) {
          filtered = filtered.filter(l => l.zone === filters.zone);
        }
        if (filters.used !== undefined) {
          filtered = filtered.filter(l => Boolean(l.used) === Boolean(filters.used));
        }
        
        filtered.sort((a, b) => {
          if (a.zone !== b.zone) return a.zone?.localeCompare(b.zone || '') || 0;
          return a.key_number?.localeCompare(b.key_number || '') || 0;
        });
        
        return { success: true, data: filtered };
      }
      return result;
    }

    let sql = 'SELECT * FROM locks WHERE 1=1';
    const params = [];

    if (filters.zone) {
      sql += ' AND zone = ?';
      params.push(filters.zone);
    }
    if (filters.used !== undefined) {
      sql += ' AND used = ?';
      params.push(filters.used ? 1 : 0);
    }

    sql += ' ORDER BY zone, key_number';
    return await this.query(sql, params);
  },

  async addLock(lock) {
    let result;
    if (!useElectron) {
      result = await localDB.add('locks', {
        key_number: lock.key_number,
        zone: lock.zone,
        used: lock.used ? 1 : 0,
        assigned_to: lock.assigned_to || null,
        remarks: lock.remarks || null
      });
    } else {
      const sql = `
        INSERT INTO locks (key_number, zone, used, assigned_to, remarks)
        VALUES (?, ?, ?, ?, ?)
      `;
      result = await this.run(sql, [
        lock.key_number,
        lock.zone,
        lock.used ? 1 : 0,
        lock.assigned_to || null,
        lock.remarks || null
      ]);
    }

    // Log action
    if (result.success) {
      await this.logAction(
        `Added lock ${lock.key_number}`,
        `Zone: ${lock.zone}, Status: ${lock.used ? 'In use' : 'Available'}`
      );
    }

    return result;
  },

  async updateLock(id, lock) {
    let result;
    if (!useElectron) {
      result = await localDB.update('locks', id, {
        key_number: lock.key_number,
        zone: lock.zone,
        used: lock.used ? 1 : 0,
        assigned_to: lock.assigned_to || null,
        remarks: lock.remarks || null
      });
    } else {
      const sql = `
        UPDATE locks 
        SET key_number = ?, zone = ?, used = ?, assigned_to = ?, remarks = ?
        WHERE id = ?
      `;
      result = await this.run(sql, [
        lock.key_number,
        lock.zone,
        lock.used ? 1 : 0,
        lock.assigned_to || null,
        lock.remarks || null,
        id
      ]);
    }

    // Log action
    if (result.success) {
      const action = lock.used ? `Lock ${lock.key_number} marked as in use` : `Lock ${lock.key_number} released`;
      await this.logAction(action, `Zone: ${lock.zone}`);
    }

    return result;
  },

  async deleteLock(id) {
    // Get lock info before deleting
    let lockName = `Lock #${id}`;
    try {
      const locks = await this.getLocks();
      if (locks.success && locks.data) {
        const lock = locks.data.find(l => l.id === id);
        if (lock) lockName = lock.key_number;
      }
    } catch (e) {
      console.error('Could not fetch lock info:', e);
    }

    let result;
    if (!useElectron) {
      result = await localDB.delete('locks', id);
    } else {
      result = await this.run('DELETE FROM locks WHERE id = ?', [id]);
    }

    // Log action
    if (result.success) {
      await this.logAction(`Deleted lock ${lockName}`);
    }

    return result;
  },

  // Helper function to update lock usage by key_number
  async updateLockUsageByKey(keyNumber, isUsed, assignedTo = null) {
    if (!keyNumber) return { success: false, error: 'No key number provided' };

    try {
      // Find the lock by key_number
      const locksResult = await this.getLocks();
      if (!locksResult.success || !locksResult.data) {
        return { success: false, error: 'Failed to fetch locks' };
      }

      const lock = locksResult.data.find(l => l.key_number === keyNumber);
      if (!lock) {
        console.warn(`Lock with key_number ${keyNumber} not found`);
        return { success: true }; // Not an error if lock doesn't exist
      }

      // Update the lock
      let result;
      if (!useElectron) {
        result = await localDB.update('locks', lock.id, {
          ...lock,
          used: isUsed ? 1 : 0,
          assigned_to: isUsed ? assignedTo : null
        });
      } else {
        const sql = `
          UPDATE locks 
          SET used = ?, assigned_to = ?
          WHERE key_number = ?
        `;
        result = await this.run(sql, [
          isUsed ? 1 : 0,
          isUsed ? assignedTo : null,
          keyNumber
        ]);
      }

      return result;
    } catch (error) {
      console.error('Error updating lock usage:', error);
      return { success: false, error: error.message };
    }
  },

  // Sync all locks with current breaker assignments
  async syncLockUsage() {
    try {
      console.log('🔄 Starting lock usage sync...');
      
      // Get all locks and breakers
      const locksResult = await this.getLocks();
      const breakersResult = await this.getBreakers();
      
      if (!locksResult.success || !breakersResult.success) {
        console.error('Failed to fetch data for sync');
        return { success: false, error: 'Failed to fetch data' };
      }

      const locks = locksResult.data || [];
      const breakers = breakersResult.data || [];
      
      console.log(`📦 Found ${locks.length} locks and ${breakers.length} breakers`);

      // Step 1: Mark all locks as available
      for (const lock of locks) {
        if (!useElectron) {
          await localDB.update('locks', lock.id, {
            ...lock,
            used: 0,
            assigned_to: null
          });
        } else {
          await this.run('UPDATE locks SET used = 0, assigned_to = NULL WHERE id = ?', [lock.id]);
        }
      }
      console.log('✓ All locks marked as available');

      // Step 2: Mark locks as used ONLY for breakers that are LOCKED (state = Closed)
      let updatedCount = 0;
      for (const breaker of breakers) {
        // Only mark lock as used if breaker has a lock AND is in Closed (locked) state
        if (breaker.lock_key && breaker.state === 'Closed') {
          const lock = locks.find(l => l.key_number === breaker.lock_key);
          if (lock) {
            if (!useElectron) {
              await localDB.update('locks', lock.id, {
                ...lock,
                used: 1,
                assigned_to: breaker.name
              });
            } else {
              await this.run(
                'UPDATE locks SET used = 1, assigned_to = ? WHERE key_number = ?',
                [breaker.name, breaker.lock_key]
              );
            }
            updatedCount++;
            console.log(`✓ Lock ${breaker.lock_key} in use by LOCKED breaker ${breaker.name}`);
          } else {
            console.warn(`⚠ Breaker ${breaker.name} references lock ${breaker.lock_key} which doesn't exist`);
          }
        } else if (breaker.lock_key && breaker.state !== 'Closed') {
          console.log(`ℹ️ Lock ${breaker.lock_key} assigned to breaker ${breaker.name} but breaker is ${breaker.state} (not locked)`);
        }
      }

      console.log(`✅ Sync complete: ${updatedCount} locks marked as in use`);
      return { success: true, updatedCount };
    } catch (error) {
      console.error('❌ Error syncing lock usage:', error);
      return { success: false, error: error.message };
    }
  },

  // Personnel
  async getPersonnel() {
    if (!useElectron) {
      return await localDB.getAll('personnel');
    }
    return await this.query('SELECT * FROM personnel ORDER BY lastname, name');
  },

  async addPersonnel(person) {
    let result;
    if (!useElectron) {
      result = await localDB.add('personnel', {
        name: person.name,
        lastname: person.lastname,
        id_card: person.id_card,
        company: person.company || null,
        habilitation: person.habilitation || null,
        pdf_path: person.pdf_path || null
      });
    } else {
      const sql = `
        INSERT INTO personnel (name, lastname, id_card, company, habilitation, pdf_path)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      result = await this.run(sql, [
        person.name,
        person.lastname,
        person.id_card,
        person.company || null,
        person.habilitation || null,
        person.pdf_path || null
      ]);
    }

    // Log action
    if (result.success) {
      await this.logAction(
        `Personnel ${person.name} ${person.lastname} added`,
        `(Habilitation: ${person.habilitation || 'N/A'})`
      );
    }

    return result;
  },

  async updatePersonnel(id, person) {
    let result;
    if (!useElectron) {
      result = await localDB.update('personnel', id, {
        name: person.name,
        lastname: person.lastname,
        id_card: person.id_card,
        company: person.company || null,
        habilitation: person.habilitation || null,
        pdf_path: person.pdf_path || null
      });
    } else {
      const sql = `
        UPDATE personnel 
        SET name = ?, lastname = ?, id_card = ?, company = ?, habilitation = ?, pdf_path = ?
        WHERE id = ?
      `;
      result = await this.run(sql, [
        person.name,
        person.lastname,
        person.id_card,
        person.company || null,
        person.habilitation || null,
        person.pdf_path || null,
        id
      ]);
    }

    // Log action
    if (result.success) {
      await this.logAction(
        `Updated personnel ${person.name} ${person.lastname}`,
        `ID: ${person.id_card}`
      );
    }

    return result;
  },

  async deletePersonnel(id) {
    // Get personnel info before deleting
    let personName = `Personnel #${id}`;
    try {
      const personnel = await this.getPersonnel();
      if (personnel.success && personnel.data) {
        const person = personnel.data.find(p => p.id === id);
        if (person) personName = `${person.name} ${person.lastname}`;
      }
    } catch (e) {
      console.error('Could not fetch personnel info:', e);
    }

    let result;
    if (!useElectron) {
      result = await localDB.delete('personnel', id);
    } else {
      result = await this.run('DELETE FROM personnel WHERE id = ?', [id]);
    }

    // Log action
    if (result.success) {
      await this.logAction(`Deleted personnel ${personName}`);
    }

    return result;
  },

  // Plans
  async getPlans() {
    if (!useElectron) {
      return await localDB.getAll('plans');
    }
    return await this.query('SELECT * FROM plans ORDER BY uploaded_at DESC');
  },

  async addPlan(plan) {
    let result;
    if (!useElectron) {
      result = await localDB.add('plans', {
        filename: plan.filename,
        file_path: plan.file_path,
        version: plan.version || null,
        uploaded_at: new Date().toISOString()
      });
    } else {
      const sql = `
        INSERT INTO plans (filename, file_path, version)
        VALUES (?, ?, ?)
      `;
      result = await this.run(sql, [
        plan.filename,
        plan.file_path,
        plan.version || null
      ]);
    }

    // Log action
    if (result.success) {
      await this.logAction(
        `Electrical plan ${plan.version ? plan.version : plan.filename} uploaded`,
        plan.version ? `File: ${plan.filename}` : null
      );
    }

    return result;
  },

  async deletePlan(id) {
    // Get plan info before deleting
    let planName = `Plan #${id}`;
    try {
      const plans = await this.getPlans();
      if (plans.success && plans.data) {
        const plan = plans.data.find(p => p.id === id);
        if (plan) planName = plan.filename;
      }
    } catch (e) {
      console.error('Could not fetch plan info:', e);
    }

    let result;
    if (!useElectron) {
      result = await localDB.delete('plans', id);
    } else {
      result = await this.run('DELETE FROM plans WHERE id = ?', [id]);
    }

    // Log action
    if (result.success) {
      await this.logAction(`Deleted electrical plan ${planName}`);
    }

    return result;
  },

  // History
  async getHistory(limit = 100) {
    if (!useElectron) {
      const history = await localDB.getAll('history');
      if (history.success && history.data) {
        // Sort and optionally limit
        const sorted = history.data.sort((a, b) => 
          new Date(b.timestamp) - new Date(a.timestamp)
        );
        // If limit is null or 0, return all
        const result = (limit && limit > 0) ? sorted.slice(0, limit) : sorted;
        return { success: true, data: result };
      }
      return history;
    }

    // If limit is null or 0, get all history
    const sql = (limit && limit > 0) 
      ? `
        SELECT h.*, b.name as breaker_name 
        FROM history h
        LEFT JOIN breakers b ON h.breaker_id = b.id
        ORDER BY h.timestamp DESC
        LIMIT ?
      `
      : `
        SELECT h.*, b.name as breaker_name 
        FROM history h
        LEFT JOIN breakers b ON h.breaker_id = b.id
        ORDER BY h.timestamp DESC
      `;
    
    return (limit && limit > 0) 
      ? await this.query(sql, [limit])
      : await this.query(sql);
  },

  async addHistory(entry) {
    if (!useElectron) {
      return await localDB.add('history', {
        breaker_id: entry.breaker_id || null,
        action: entry.action,
        user: entry.user || entry.user_mode || 'Admin',
        details: entry.details || null,
        timestamp: new Date().toISOString()
      });
    }

    const sql = `
      INSERT INTO history (breaker_id, action, user_mode, details)
      VALUES (?, ?, ?, ?)
    `;
    return await this.run(sql, [
      entry.breaker_id || null,
      entry.action,
      entry.user || entry.user_mode || 'Admin',
      entry.details || null
    ]);
  },

  async clearHistory() {
    if (!useElectron) {
      return await localDB.clear('history');
    }
    return await this.run('DELETE FROM history');
  },

  // Statistics
  async getStats() {
    if (!useElectron) {
      // IndexedDB fallback - calculate from data
      try {
        const breakers = (await localDB.getAll('breakers')).data || [];
        const locks = (await localDB.getAll('locks')).data || [];
        const personnel = (await localDB.getAll('personnel')).data || [];
        
        const stats = {
          totalBreakers: breakers.length,
          breakersOn: breakers.filter(b => b.state === 'On').length,
          lockedBreakers: breakers.filter(b => b.state === 'Closed').length,
          totalLocks: locks.length,
          usedLocks: locks.filter(l => l.used === 1 || l.used === true).length,
          totalPersonnel: personnel.length
        };
        
        return { success: true, data: stats };
      } catch (error) {
        console.error('getStats error:', error);
        return { success: false, error: error.message };
      }
    }

    const stats = {};
    
    const breakersCount = await this.query('SELECT COUNT(*) as count FROM breakers');
    stats.totalBreakers = breakersCount.data?.[0]?.count || 0;
    
    const breakersOnCount = await this.query("SELECT COUNT(*) as count FROM breakers WHERE state = 'On'");
    stats.breakersOn = breakersOnCount.data?.[0]?.count || 0;
    
    const lockedCount = await this.query("SELECT COUNT(*) as count FROM breakers WHERE state = 'Closed'");
    stats.lockedBreakers = lockedCount.data?.[0]?.count || 0;
    
    const locksCount = await this.query('SELECT COUNT(*) as count FROM locks');
    stats.totalLocks = locksCount.data?.[0]?.count || 0;
    
    const usedLocks = await this.query('SELECT COUNT(*) as count FROM locks WHERE used = 1');
    stats.usedLocks = usedLocks.data?.[0]?.count || 0;
    
    const personnelCount = await this.query('SELECT COUNT(*) as count FROM personnel');
    stats.totalPersonnel = personnelCount.data?.[0]?.count || 0;
    
    return { success: true, data: stats };
  },

  // Get statistics calculated from breaker data (not lock table)
  // This ensures "Locks in Use" matches the actual number of locked breakers
  async getStatsFromBreakers() {
    try {
      const breakersResult = await this.getBreakers();
      const locksResult = await this.getLocks();
      const personnelResult = await this.getPersonnel();

      if (!breakersResult.success || !locksResult.success || !personnelResult.success) {
        return { success: false, error: 'Failed to fetch data' };
      }

      const breakers = breakersResult.data || [];
      const locks = locksResult.data || [];
      const personnel = personnelResult.data || [];

      // Calculate locks in use from BREAKERS
      // A lock is "in use" if a breaker is Closed (locked) and has a lock_key
      const lockedBreakersWithLocks = breakers.filter(b => 
        b.state === 'Closed' && b.lock_key && b.lock_key.trim() !== ''
      );

      const stats = {
        totalBreakers: breakers.length,
        breakersOn: breakers.filter(b => b.state === 'On').length,
        lockedBreakers: breakers.filter(b => b.state === 'Closed').length,
        totalLocks: locks.length,
        usedLocks: lockedBreakersWithLocks.length,  // From breaker data
        totalPersonnel: personnel.length
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('getStatsFromBreakers error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get locks by zone from breaker data
  async getLocksByZone() {
    try {
      const breakersResult = await this.getBreakers();
      
      if (!breakersResult.success) {
        return { success: false, error: 'Failed to fetch breakers' };
      }

      const breakers = breakersResult.data || [];

      // Group locked breakers by zone
      const zoneStats = {};
      
      breakers.forEach(breaker => {
        // Only count breakers that are Closed (locked) and have a lock_key
        if (breaker.state === 'Closed' && breaker.lock_key && breaker.lock_key.trim() !== '') {
          const zone = breaker.zone || 'Unknown';
          
          if (!zoneStats[zone]) {
            zoneStats[zone] = {
              zone: zone,
              locksInUse: 0,
              breakers: []
            };
          }
          
          zoneStats[zone].locksInUse++;
          zoneStats[zone].breakers.push({
            name: breaker.name,
            location: breaker.location,
            lock_key: breaker.lock_key
          });
        }
      });

      // Convert to array and sort by zone name
      const zoneArray = Object.values(zoneStats).sort((a, b) => 
        a.zone.localeCompare(b.zone)
      );

      return { success: true, data: zoneArray };
    } catch (error) {
      console.error('getLocksByZone error:', error);
      return { success: false, error: error.message };
    }
  },

  // Zones and Locations
  async getZones() {
    if (!useElectron) {
      const breakers = (await localDB.getAll('breakers')).data || [];
      const zones = [...new Set(breakers.map(b => b.zone).filter(Boolean))];
      return zones.sort();
    }

    const result = await this.query('SELECT DISTINCT zone FROM breakers ORDER BY zone');
    return result.success ? result.data.map(r => r.zone) : [];
  },

  async getLocations(zone) {
    if (!useElectron) {
      const breakers = (await localDB.getAll('breakers')).data || [];
      const filtered = zone ? breakers.filter(b => b.zone === zone) : breakers;
      const locations = [...new Set(filtered.map(b => b.location).filter(Boolean))];
      return locations.sort();
    }

    if (zone) {
      const result = await this.query('SELECT DISTINCT location FROM breakers WHERE zone = ? ORDER BY location', [zone]);
      return result.success ? result.data.map(r => r.location) : [];
    }
    const result = await this.query('SELECT DISTINCT location FROM breakers ORDER BY location');
    return result.success ? result.data.map(r => r.location) : [];
  }
};

export default db;
