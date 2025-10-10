#!/usr/bin/env python3
"""
数据库备份和恢复管理脚本
支持PostgreSQL数据库的备份和恢复操作
"""

import os
import sys
import subprocess
import argparse
import datetime
import glob
from pathlib import Path

class DatabaseManager:
    def __init__(self):
        # 数据库配置
        self.db_name = "cosplay_db"
        self.db_user = "cosplay_user"
        self.db_password = "cosplay_password_2024"
        self.db_host = "localhost"
        self.db_port = "5432"
        self.container_name = "cosplay_db"
        
        # 备份目录
        self.backup_dir = Path("./database")
        self.backup_dir.mkdir(exist_ok=True)
        
    def check_docker_container(self):
        """检查Docker容器是否运行"""
        try:
            result = subprocess.run(
                ["sudo", "docker", "ps", "--filter", f"name={self.container_name}", "--format", "{{.Names}}"],
                capture_output=True,
                text=True,
                check=True
            )
            return self.container_name in result.stdout
        except subprocess.CalledProcessError:
            return False
    
    def backup_database(self, custom_name=None):
        """备份数据库到./database目录"""
        if not self.check_docker_container():
            print(f"❌ 错误: Docker容器 '{self.container_name}' 未运行")
            return False
        
        # 生成备份文件名
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        if custom_name:
            backup_filename = f"{custom_name}_{timestamp}.sql"
        else:
            backup_filename = f"{self.db_name}_backup_{timestamp}.sql"
        
        backup_path = self.backup_dir / backup_filename
        
        print(f"🔄 开始备份数据库 '{self.db_name}'...")
        print(f"📁 备份文件: {backup_path}")
        
        try:
            # 使用pg_dump通过Docker容器备份数据库
            cmd = [
                "sudo", "docker", "exec", self.container_name,
                "pg_dump", "-U", self.db_user, "-d", self.db_name
            ]
            
            with open(backup_path, 'w') as f:
                result = subprocess.run(cmd, stdout=f, stderr=subprocess.PIPE, text=True)
            
            if result.returncode == 0:
                # 检查备份文件大小
                file_size = backup_path.stat().st_size
                if file_size > 0:
                    print(f"✅ 备份成功!")
                    print(f"📊 文件大小: {file_size / 1024:.1f} KB")
                    print(f"📍 备份位置: {backup_path}")
                    return True
                else:
                    print("❌ 备份失败: 生成的文件为空")
                    backup_path.unlink()  # 删除空文件
                    return False
            else:
                print(f"❌ 备份失败: {result.stderr}")
                if backup_path.exists():
                    backup_path.unlink()  # 删除失败的文件
                return False
                
        except Exception as e:
            print(f"❌ 备份过程中发生错误: {e}")
            if backup_path.exists():
                backup_path.unlink()
            return False
    
    def list_backups(self):
        """列出所有可用的备份文件"""
        backup_files = list(self.backup_dir.glob("*.sql"))
        
        if not backup_files:
            print("📂 没有找到备份文件")
            return []
        
        print("📋 可用的备份文件:")
        backup_files.sort(key=lambda x: x.stat().st_mtime, reverse=True)
        
        for i, backup_file in enumerate(backup_files, 1):
            stat = backup_file.stat()
            size_kb = stat.st_size / 1024
            mtime = datetime.datetime.fromtimestamp(stat.st_mtime)
            print(f"  {i}. {backup_file.name}")
            print(f"     📅 创建时间: {mtime.strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"     📊 文件大小: {size_kb:.1f} KB")
            print()
        
        return backup_files
    
    def restore_database(self, backup_file=None, interactive=True):
        """从指定的备份文件恢复数据库"""
        if not self.check_docker_container():
            print(f"❌ 错误: Docker容器 '{self.container_name}' 未运行")
            return False
        
        # 如果没有指定备份文件，让用户选择
        if not backup_file:
            backup_files = self.list_backups()
            if not backup_files:
                return False
            
            if interactive:
                try:
                    choice = input("请选择要恢复的备份文件编号 (输入 q 退出): ").strip()
                    if choice.lower() == 'q':
                        print("操作已取消")
                        return False
                    
                    index = int(choice) - 1
                    if 0 <= index < len(backup_files):
                        backup_file = backup_files[index]
                    else:
                        print("❌ 无效的选择")
                        return False
                except (ValueError, KeyboardInterrupt):
                    print("❌ 无效的输入或操作已取消")
                    return False
            else:
                # 非交互模式，选择最新的备份
                backup_file = backup_files[0]
        else:
            backup_file = Path(backup_file)
            if not backup_file.exists():
                print(f"❌ 备份文件不存在: {backup_file}")
                return False
        
        print(f"🔄 准备从备份文件恢复数据库...")
        print(f"📁 备份文件: {backup_file}")
        
        # 确认操作
        if interactive:
            confirm = input("⚠️  警告: 此操作将覆盖现有数据库内容! 确认继续? (y/N): ").strip().lower()
            if confirm != 'y':
                print("操作已取消")
                return False
        
        try:
            print("🔄 正在恢复数据库...")
            
            # 使用psql通过Docker容器恢复数据库
            cmd = [
                "sudo", "docker", "exec", "-i", self.container_name,
                "psql", "-U", self.db_user, "-d", self.db_name
            ]
            
            with open(backup_file, 'r') as f:
                result = subprocess.run(cmd, stdin=f, stderr=subprocess.PIPE, text=True)
            
            if result.returncode == 0:
                print("✅ 数据库恢复成功!")
                return True
            else:
                print(f"❌ 恢复失败: {result.stderr}")
                return False
                
        except Exception as e:
            print(f"❌ 恢复过程中发生错误: {e}")
            return False
    
    def cleanup_old_backups(self, keep_count=10):
        """清理旧的备份文件，保留最新的指定数量"""
        backup_files = list(self.backup_dir.glob("*.sql"))
        backup_files.sort(key=lambda x: x.stat().st_mtime, reverse=True)
        
        if len(backup_files) <= keep_count:
            print(f"📂 当前有 {len(backup_files)} 个备份文件，无需清理")
            return
        
        files_to_delete = backup_files[keep_count:]
        print(f"🧹 清理旧备份文件，保留最新的 {keep_count} 个...")
        
        for file_path in files_to_delete:
            try:
                file_path.unlink()
                print(f"  🗑️  已删除: {file_path.name}")
            except Exception as e:
                print(f"  ❌ 删除失败 {file_path.name}: {e}")
        
        print(f"✅ 清理完成，保留了 {keep_count} 个最新备份")

def main():
    parser = argparse.ArgumentParser(description="PostgreSQL数据库备份和恢复工具")
    parser.add_argument("action", choices=["backup", "restore", "list", "cleanup"], 
                       help="操作类型: backup(备份), restore(恢复), list(列出备份), cleanup(清理旧备份)")
    parser.add_argument("--file", "-f", help="指定备份文件路径 (用于恢复操作)")
    parser.add_argument("--name", "-n", help="自定义备份文件名前缀")
    parser.add_argument("--keep", "-k", type=int, default=10, help="清理时保留的备份文件数量 (默认: 10)")
    parser.add_argument("--no-interactive", action="store_true", help="非交互模式")
    
    args = parser.parse_args()
    
    db_manager = DatabaseManager()
    
    if args.action == "backup":
        success = db_manager.backup_database(custom_name=args.name)
        sys.exit(0 if success else 1)
        
    elif args.action == "restore":
        interactive = not args.no_interactive
        success = db_manager.restore_database(backup_file=args.file, interactive=interactive)
        sys.exit(0 if success else 1)
        
    elif args.action == "list":
        db_manager.list_backups()
        
    elif args.action == "cleanup":
        db_manager.cleanup_old_backups(keep_count=args.keep)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n操作已取消")
        sys.exit(1)
    except Exception as e:
        print(f"❌ 发生未预期的错误: {e}")
        sys.exit(1)