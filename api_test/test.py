"""多模型 AI 对话工具"""

from dotenv import load_dotenv
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
import os

load_dotenv()

"""读取 .env 中的 API 配置"""
def load_configs():
    configs = {}
    for key in os.environ:
        if key.endswith('_MODELS'):
            p = key[:-7]
            if api_key := os.getenv(f"{p}_API_KEY"):
                configs[p] = {
                    "name": p.replace('_', ' ').title(),
                    "api_key": api_key,
                    "base_url": os.getenv(f"{p}_BASE_URL"),
                    "type": os.getenv(f"{p}_TYPE", "openai"),
                    "models": [m.strip() for m in os.getenv(key, "").split(',') if m.strip()],
                }
    return configs

"""交互式选择 API 和模型"""
def pick_model(configs):
    apis = list(configs.keys())

    print("\n选择 API:")
    for i, k in enumerate(apis, 1):
        print(f"{i}. {configs[k]['name']}")
    cfg = configs[apis[int(input("> ")) - 1]]

    print(f"\n选择 {cfg['name']} 模型:")
    for i, m in enumerate(cfg['models'], 1):
        print(f"{i}. {m}")
    model_name = cfg['models'][int(input("> ")) - 1]

    print(f"\n✅ {cfg['name']} | {model_name}")

    kwargs = {"api_key": cfg['api_key'], "base_url": cfg['base_url'], "model": model_name}
    if cfg['type'] == 'anthropic':
        from langchain_anthropic import ChatAnthropic
        return ChatAnthropic(**kwargs)
    else:
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(**kwargs)

"""对话循环"""
def chat(model):
    chain = ChatPromptTemplate.from_messages([
        ("system", "自然语言中文回答"),
        MessagesPlaceholder("history"),
        ("user", "{input}")
    ]) | model

    history = []
    print("\n[quit=退出 | clear=清空]\n")

    # 内层函数：处理单轮对话
    def handle_input(q):
        """处理用户输入，返回是否继续循环"""
        # 空输入：继续循环
        if not q:
            return True

        # 退出命令：结束循环
        if q == "quit":
            print("👋")
            return False

        # 清空命令：重置历史，继续循环
        if q == "clear":
            history.clear()
            print("[已清空]\n")
            return True

        # 正常对话：调用模型
        print("🤖 ...", end="", flush=True)
        r = chain.invoke({"history": history, "input": q})
        print(f"\rAI: {r.content}\n")

        # 保存到历史，限制20条
        history.extend([HumanMessage(content=q), AIMessage(content=r.content)])
        if len(history) > 20:
            history[:] = history[-20:]  # 原地修改，更省内存

        return True

    # 主循环：只要 handle_input 返回 True 就继续
    while handle_input(input("你: ").strip()):
        pass


if __name__ == "__main__":
    if configs := load_configs():
        chat(pick_model(configs))
    else:
        print("错误：请在 .env 中配置 XXX_API_KEY 和 XXX_MODELS")
