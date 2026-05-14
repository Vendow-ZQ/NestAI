"""
LangGraph工作流服务 - 实现NestAI的三阶段工作流

工作流阶段：
1. P001: Space Analysis - 空间分析
2. P002: Intervention Generation - 干预方案生成
3. P003: Letter Generation - 告别信生成
"""

import json
import re
from typing import Dict, Any, Optional, List, TypedDict
from datetime import datetime

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langgraph.graph import StateGraph, END

from app.core.llm_manager import llm_manager
from app.prompts import create_p001_prompt, create_p002_prompt, create_p003_prompt
from app.services.memory_service import MemoryService


# ============== 定义状态类型 ==============

class WorkflowState(TypedDict):
    """工作流状态"""
    session_id: str
    user_id: str
    current_stage: str  # p001, p002, p003, complete

    # P001 输入/输出
    image_description: Optional[str]
    space_summary: Optional[str]
    questions: Optional[List[Dict]]

    # P002 输入/输出
    aspiration: Optional[List[str]]
    current_state: Optional[List[str]]
    constraints: Optional[Dict[str, str]]
    intervention_plan: Optional[Dict[str, Any]]

    # P003 输入/输出
    selected_level: Optional[str]
    completion_status: Optional[str]
    user_feeling: Optional[str]
    farewell_letter: Optional[str]

    # 错误处理
    error: Optional[str]


# ============== P001: 空间分析节点 ==============

def p001_space_analysis_node(state: WorkflowState) -> WorkflowState:
    """P001: 空间分析节点"""
    try:
        # 创建Prompt
        prompt = create_p001_prompt()

        # 获取模型
        model = llm_manager.get_model()

        # 构建输入
        image_desc = state.get("image_description", "未提供图片描述")

        # 调用模型
        messages = prompt.format_messages(
            history=[],
            image_description=image_desc
        )

        response = model.invoke(messages)
        content = response.content

        # 解析输出
        memory_match = re.search(r'---MEMORY---(.*?)---QUESTIONS---', content, re.DOTALL)
        questions_match = re.search(r'---QUESTIONS---(.*?)---END---', content, re.DOTALL)

        if memory_match and questions_match:
            space_summary = memory_match.group(1).strip()
            questions_json = questions_match.group(1).strip()

            # 解析问题JSON
            try:
                questions = json.loads(questions_json)
            except json.JSONDecodeError:
                # 尝试从Markdown代码块解析
                json_match = re.search(r'```json\s*(.*?)\s*```', questions_json, re.DOTALL)
                if json_match:
                    questions = json.loads(json_match.group(1))
                else:
                    questions = []
        else:
            # 如果解析失败，使用整个内容作为摘要
            space_summary = content
            questions = []

        # 更新状态
        state["space_summary"] = space_summary
        state["questions"] = questions
        state["current_stage"] = "p001_complete"

    except Exception as e:
        state["error"] = f"P001 Error: {str(e)}"
        state["current_stage"] = "error"

    return state


# ============== P002: 干预方案生成节点 ==============

def p002_intervention_node(state: WorkflowState) -> WorkflowState:
    """P002: 干预方案生成节点"""
    try:
        # 创建Prompt
        prompt = create_p002_prompt()

        # 获取模型
        model = llm_manager.get_model()

        # 获取约束条件
        constraints = state.get("constraints", {})

        # 调用模型
        messages = prompt.format_messages(
            history=[],
            space_summary=state.get("space_summary", ""),
            aspiration=", ".join(state.get("aspiration", [])),
            current_state=", ".join(state.get("current_state", [])),
            sharing=constraints.get("sharing", "未知"),
            budget=constraints.get("budget", "未知"),
            wall_modification=constraints.get("wall_modification", "未知")
        )

        response = model.invoke(messages)
        content = response.content

        # 解析JSON输出
        try:
            # 尝试直接解析
            intervention_plan = json.loads(content)
        except json.JSONDecodeError:
            # 尝试从Markdown代码块解析
            json_match = re.search(r'```json\s*(.*?)\s*```', content, re.DOTALL)
            if json_match:
                intervention_plan = json.loads(json_match.group(1))
            else:
                # 使用正则提取JSON对象
                json_match = re.search(r'\{.*\}', content, re.DOTALL)
                if json_match:
                    intervention_plan = json.loads(json_match.group())
                else:
                    raise ValueError("无法解析干预方案JSON")

        # 更新状态
        state["intervention_plan"] = intervention_plan
        state["current_stage"] = "p002_complete"

    except Exception as e:
        state["error"] = f"P002 Error: {str(e)}"
        state["current_stage"] = "error"

    return state


# ============== P003: 告别信生成节点 ==============

def p003_letter_node(state: WorkflowState) -> WorkflowState:
    """P003: 告别信生成节点"""
    try:
        # 创建Prompt
        prompt = create_p003_prompt()

        # 获取模型
        model = llm_manager.get_model()

        # 获取干预方案
        intervention = state.get("intervention_plan", {})
        selected_level = state.get("selected_level", "tonight")
        selected_plan = intervention.get(selected_level, {})

        # 构建对话历史摘要
        conversation_summary = f"""
用户期望: {', '.join(state.get('aspiration', []))}
当前状态: {', '.join(state.get('current_state', []))}
空间观察: {state.get('space_summary', '')[:200]}...
"""

        # 调用模型
        messages = prompt.format_messages(
            history=[],
            user_id=state.get("user_id", "朋友"),
            intervention_level=selected_level,
            intervention_plan=json.dumps(selected_plan, ensure_ascii=False, indent=2),
            completion_status=state.get("completion_status", "完成"),
            user_feeling=state.get("user_feeling", "感觉不错"),
            conversation_summary=conversation_summary
        )

        response = model.invoke(messages)

        # 更新状态
        state["farewell_letter"] = response.content
        state["current_stage"] = "p003_complete"

    except Exception as e:
        state["error"] = f"P003 Error: {str(e)}"
        state["current_stage"] = "error"

    return state


# ============== 条件路由函数 ==============

def route_after_p001(state: WorkflowState) -> str:
    """P001完成后的路由"""
    if state.get("error"):
        return "error"
    return "p002"


def route_after_p002(state: WorkflowState) -> str:
    """P002完成后的路由"""
    if state.get("error"):
        return "error"
    return "end"


def route_after_p003(state: WorkflowState) -> str:
    """P003完成后的路由"""
    if state.get("error"):
        return "error"
    return "end"


# ============== 构建工作流图 ==============

def create_workflow_graph() -> StateGraph:
    """创建完整的工作流图"""

    # 创建工作流
    workflow = StateGraph(WorkflowState)

    # 添加节点
    workflow.add_node("p001", p001_space_analysis_node)
    workflow.add_node("p002", p002_intervention_node)
    workflow.add_node("p003", p003_letter_node)

    # 添加边和条件路由
    workflow.add_conditional_edges(
        "p001",
        route_after_p001,
        {
            "p002": "p002",
            "error": END
        }
    )

    workflow.add_conditional_edges(
        "p002",
        route_after_p002,
        {
            "end": END,
            "error": END
        }
    )

    workflow.add_conditional_edges(
        "p003",
        route_after_p003,
        {
            "end": END,
            "error": END
        }
    )

    # 设置入口点
    workflow.set_entry_point("p001")

    return workflow.compile()


# ============== 工作流服务类 ==============

class WorkflowService:
    """LangGraph工作流服务"""

    def __init__(self, memory_service: MemoryService):
        self.memory_service = memory_service
        self.workflow = create_workflow_graph()

    async def run_space_analysis(self, session_id: str, image_description: str) -> Dict[str, Any]:
        """
        运行P001空间分析

        Args:
            session_id: 会话ID
            image_description: 图片描述

        Returns:
            {"space_summary": str, "questions": List[Dict]}
        """
        # 初始化状态
        initial_state: WorkflowState = {
            "session_id": session_id,
            "user_id": "dev_user",  # TODO: 从认证获取
            "current_stage": "p001",
            "image_description": image_description,
            "space_summary": None,
            "questions": None,
            "aspiration": None,
            "current_state": None,
            "constraints": None,
            "intervention_plan": None,
            "selected_level": None,
            "completion_status": None,
            "user_feeling": None,
            "farewell_letter": None,
            "error": None
        }

        # 运行工作流
        result = self.workflow.invoke(initial_state)

        # 保存结果到数据库
        if result.get("space_summary"):
            self.memory_service.update_session_field(
                session_id,
                "space_analysis",
                {"summary": result["space_summary"], "questions": result.get("questions", [])}
            )
            self.memory_service.update_session_status(session_id, "analyzed")

        return {
            "space_summary": result.get("space_summary"),
            "questions": result.get("questions", []),
            "error": result.get("error")
        }

    async def run_intervention_generation(
        self,
        session_id: str,
        aspiration: List[str],
        current_state: List[str],
        constraints: Dict[str, str]
    ) -> Dict[str, Any]:
        """
        运行P002干预方案生成

        Args:
            session_id: 会话ID
            aspiration: 用户期望
            current_state: 当前状态
            constraints: 约束条件

        Returns:
            {"intervention_plan": Dict}
        """
        # 获取之前的分析结果
        memory = self.memory_service.get_session_memory(session_id)
        space_summary = ""
        if memory and memory.space_analysis:
            try:
                analysis_data = json.loads(memory.space_analysis)
                space_summary = analysis_data.get("summary", "")
            except:
                pass

        # 初始化状态
        initial_state: WorkflowState = {
            "session_id": session_id,
            "user_id": "dev_user",
            "current_stage": "p002",
            "image_description": None,
            "space_summary": space_summary,
            "questions": None,
            "aspiration": aspiration,
            "current_state": current_state,
            "constraints": constraints,
            "intervention_plan": None,
            "selected_level": None,
            "completion_status": None,
            "user_feeling": None,
            "farewell_letter": None,
            "error": None
        }

        # 运行工作流（从P002开始）
        result = self.workflow.invoke(initial_state)

        # 保存结果
        if result.get("intervention_plan"):
            self.memory_service.update_session_field(
                session_id,
                "intervention_plan",
                result["intervention_plan"]
            )
            self.memory_service.update_session_status(session_id, "generated")

        return {
            "intervention_plan": result.get("intervention_plan"),
            "error": result.get("error")
        }

    async def run_letter_generation(
        self,
        session_id: str,
        selected_level: str,
        completion_status: str,
        user_feeling: str
    ) -> Dict[str, Any]:
        """
        运行P003告别信生成

        Args:
            session_id: 会话ID
            selected_level: 选择的干预层级
            completion_status: 完成状态
            user_feeling: 用户感受

        Returns:
            {"farewell_letter": str}
        """
        # 获取之前的记忆
        memory = self.memory_service.get_session_memory(session_id)
        space_summary = ""
        intervention_plan = {}

        if memory:
            if memory.space_analysis:
                try:
                    analysis_data = json.loads(memory.space_analysis)
                    space_summary = analysis_data.get("summary", "")
                except:
                    pass

            if memory.intervention_plan:
                try:
                    intervention_plan = json.loads(memory.intervention_plan)
                except:
                    pass

        # 初始化状态
        initial_state: WorkflowState = {
            "session_id": session_id,
            "user_id": "dev_user",
            "current_stage": "p003",
            "image_description": None,
            "space_summary": space_summary,
            "questions": None,
            "aspiration": None,
            "current_state": None,
            "constraints": None,
            "intervention_plan": intervention_plan,
            "selected_level": selected_level,
            "completion_status": completion_status,
            "user_feeling": user_feeling,
            "farewell_letter": None,
            "error": None
        }

        # 运行P003节点（直接调用）
        result = p003_letter_node(initial_state)

        # 保存结果
        if result.get("farewell_letter"):
            self.memory_service.update_session_field(
                session_id,
                "letter_content",
                result["farewell_letter"]
            )
            self.memory_service.update_session_status(session_id, "letter_done")

        return {
            "farewell_letter": result.get("farewell_letter"),
            "error": result.get("error")
        }


# 全局工作流服务实例
_workflow_service: Optional[WorkflowService] = None


def get_workflow_service(memory_service: MemoryService) -> WorkflowService:
    """获取工作流服务实例"""
    global _workflow_service
    if _workflow_service is None:
        _workflow_service = WorkflowService(memory_service)
    return _workflow_service
