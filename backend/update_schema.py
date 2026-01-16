import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cosplay_api.settings')
django.setup()

import psycopg2
from decouple import config

conn = psycopg2.connect(
    dbname=config('DB_NAME'),
    user=config('DB_USER'),
    password=config('DB_PASSWORD'),
    host=config('DB_HOST'),
    port=config('DB_PORT')
)
cursor = conn.cursor()

# 添加 nickname 列
try:
    cursor.execute("ALTER TABLE users_user ADD COLUMN IF NOT EXISTS nickname VARCHAR(50);")
    print('Added nickname column')
except Exception as e:
    print(f'Error adding nickname: {e}')

# 添加 bio 列
try:
    cursor.execute('ALTER TABLE users_user ADD COLUMN IF NOT EXISTS bio TEXT;')
    print('Added bio column')
except Exception as e:
    print(f'Error adding bio: {e}')

# 添加 avatar 列
try:
    cursor.execute("ALTER TABLE users_user ADD COLUMN IF NOT EXISTS avatar VARCHAR(100);")
    print('Added avatar column')
except Exception as e:
    print(f'Error adding avatar: {e}')

# 添加 role_application_pending 列
try:
    cursor.execute('ALTER TABLE users_user ADD COLUMN IF NOT EXISTS role_application_pending BOOLEAN DEFAULT FALSE;')
    print('Added role_application_pending column')
except Exception as e:
    print(f'Error adding role_application_pending: {e}')

# 添加 role_application_reason 列
try:
    cursor.execute('ALTER TABLE users_user ADD COLUMN IF NOT EXISTS role_application_reason TEXT;')
    print('Added role_application_reason column')
except Exception as e:
    print(f'Error adding role_application_reason: {e}')

# 添加 role_application_date 列
try:
    cursor.execute('ALTER TABLE users_user ADD COLUMN IF NOT EXISTS role_application_date TIMESTAMP;')
    print('Added role_application_date column')
except Exception as e:
    print(f'Error adding role_application_date: {e}')

conn.commit()
cursor.close()
conn.close()
print('Database schema updated successfully')
