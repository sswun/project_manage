// 数据备份工具 - 自动保存到本地文件
const fs = require('fs');
const path = require('path');

class DataBackup {
    constructor() {
        this.dataDir = path.join(__dirname, 'data');
        this.backupFile = path.join(this.dataDir, 'projects_backup.json');
        this.ensureDataDir();
    }

    // 确保数据目录存在
    ensureDataDir() {
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }
    }

    // 保存数据到本地文件
    saveData(data) {
        try {
            const backupData = {
                ...data,
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            };

            fs.writeFileSync(this.backupFile, JSON.stringify(backupData, null, 2), 'utf8');

            // 创建带时间戳的备份文件
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const timestampFile = path.join(this.dataDir, `projects_${timestamp}.json`);
            fs.writeFileSync(timestampFile, JSON.stringify(backupData, null, 2), 'utf8');

            console.log('数据已成功保存到本地文件');
            return true;
        } catch (error) {
            console.error('保存数据失败:', error);
            return false;
        }
    }

    // 从本地文件读取数据
    loadData() {
        try {
            if (fs.existsSync(this.backupFile)) {
                const data = fs.readFileSync(this.backupFile, 'utf8');
                return JSON.parse(data);
            }
            return null;
        } catch (error) {
            console.error('读取数据失败:', error);
            return null;
        }
    }

    // 获取所有备份文件
    getBackupFiles() {
        try {
            const files = fs.readdirSync(this.dataDir)
                .filter(file => file.startsWith('projects_') && file.endsWith('.json'))
                .sort((a, b) => {
                    const timeA = new Date(a.replace(/projects_|\.json/g, '').replace(/-/g, ':'));
                    const timeB = new Date(b.replace(/projects_|\.json/g, '').replace(/-/g, ':'));
                    return timeB - timeA;
                });

            return files;
        } catch (error) {
            console.error('获取备份文件列表失败:', error);
            return [];
        }
    }

    // 清理旧备份文件（保留最近10个）
    cleanOldBackups() {
        try {
            const files = this.getBackupFiles();
            if (files.length > 10) {
                const filesToDelete = files.slice(10);
                filesToDelete.forEach(file => {
                    const filePath = path.join(this.dataDir, file);
                    fs.unlinkSync(filePath);
                    console.log(`已删除旧备份文件: ${file}`);
                });
            }
        } catch (error) {
            console.error('清理旧备份文件失败:', error);
        }
    }
}

module.exports = DataBackup;