from sql_agent_cached import SQLAgent

def main():
    """演示SQL Agent的使用"""
    print("🚀 SQL Agent 演示")
    print("=" * 50)

    # 创建Agent实例（避免与类名重名导致 UnboundLocalError）
    sql_agent = SQLAgent()
    # 使用更贴近当前数据库的示例问题
    question = "2024年获得金奖的团队和剧名"

    # 使用封装的 query 方法执行查询并输出结果
    answer = sql_agent.query(question)
    print(answer)

if __name__ == "__main__":
    main()