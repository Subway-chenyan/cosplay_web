#!/usr/bin/env python3
import os
import re
from dotenv import load_dotenv
from langchain_community.utilities import SQLDatabase

load_dotenv()

def build_uri():
    return (
        f"postgresql+psycopg2://"
        f"{os.getenv('POSTGRES_USER')}:"
        f"{os.getenv('POSTGRES_PASSWORD')}@"
        f"{os.getenv('POSTGRES_IP')}:"
        f"{os.getenv('POSTGRES_PORT')}/"
        f"{os.getenv('POSTGRES_DB')}"
    )

if __name__ == '__main__':
    uri = build_uri()
    print(f"Connecting: {uri}")
    db = SQLDatabase.from_uri(uri)
    year = 2024
    award_kw = '金奖'
    sql = (
        "SELECT DISTINCT ar.video_id AS video_id, ar.group_id AS group_id "
        "FROM awards_awardrecord ar "
        "JOIN awards_award a ON a.id = ar.award_id "
        "JOIN competitions_competitionyear cy ON cy.id = ar.competition_year_id "
        f"WHERE cy.year = {year} AND a.name ILIKE '%{award_kw}%' "
        "AND (ar.video_id IS NOT NULL OR ar.group_id IS NOT NULL);"
    )
    print("\nSQL:")
    print(sql)
    rows = db.run(sql)
    print("\nRaw result:")
    print(rows)
    vids, gids = [], []
    if isinstance(rows, list):
        for r in rows:
            if isinstance(r, (list, tuple)):
                if len(r) >= 1 and r[0]:
                    vids.append(str(r[0]))
                if len(r) >= 2 and r[1]:
                    gids.append(str(r[1]))
            elif isinstance(r, dict):
                if r.get('video_id'): vids.append(str(r['video_id']))
                if r.get('group_id'): gids.append(str(r['group_id']))
    elif isinstance(rows, str):
        uuids = re.findall(r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}", rows)
        vids.extend(uuids)
        gids.extend(uuids)
    vids = sorted(list(set(vids)))
    gids = sorted(list(set(gids)))
    print("\nParsed video_id_list:")
    print(vids)
    print("Parsed group_id_list:")
    print(gids)