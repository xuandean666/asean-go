import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquare,
  Plus,
  Send,
  Sparkles,
  User,
  Globe,
  Lightbulb,
  Target,
  MessageCircle,
  Clock,
  ChevronRight,
  Bot,
  TrendingDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  customerService as api,
} from '@/api/index';
import type { Conversation, Message } from '@shared/api.interface';
import { logger } from '@lark-apaas/client-toolkit/logger';

const LANGUAGES = [
  { code: 'vi', name: '越南语', flag: '🇻🇳' },
  { code: 'th', name: '泰语', flag: '🇹🇭' },
  { code: 'id', name: '印尼语', flag: '🇮🇩' },
  { code: 'ms', name: '马来语', flag: '🇲🇾' },
  { code: 'fil', name: '菲律宾语', flag: '🇵🇭' },
];

const SCENES = [
  { value: 'pre-sales', label: '售前咨询' },
  { value: 'aftersales', label: '售后服务' },
  { value: 'bargain', label: '议价谈判' },
  { value: 'urging', label: '催单跟进' },
  { value: 'review', label: '差评安抚' },
];

const PERSONAS = [
  { value: '客服', label: '客服角色' },
  { value: '销售', label: '销售角色' },
];

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins} 分钟前`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} 小时前`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} 天前`;
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

function getLangInfo(code?: string) {
  if (!code) return { name: '未知', flag: '🌐' };
  const lang = LANGUAGES.find((l) => l.code === code || code.startsWith(l.code));
  return lang ?? { name: code, flag: '🌐' };
}

export default function CustomerServicePage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('vi');
  const [selectedScene, setSelectedScene] = useState('pre-sales');
  const [selectedPersona, setSelectedPersona] = useState('客服');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load conversations
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setConversationsLoading(true);
      try {
        const result = await api.getConversations({
          page: 1,
          pageSize: 20,
          language: languageFilter === 'all' ? undefined : languageFilter,
        });
        if (!cancelled) {
          setConversations(result.items);
          if (result.items.length > 0 && !activeConversationId) {
            setActiveConversationId(result.items[0].id);
          }
        }
      } catch (error) {
        logger.error('加载会话列表失败', error);
      } finally {
        if (!cancelled) setConversationsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [languageFilter, activeConversationId]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConversationId) return;
    let cancelled = false;

    async function load() {
      setMessagesLoading(true);
      try {
        const [conv, msgs] = await Promise.all([
          api.getConversation(activeConversationId),
          api.getMessages(activeConversationId),
        ]);
        if (!cancelled) {
          setActiveConversation(conv);
          setMessages(msgs);
          // Set language from conversation
          if (conv.languagePair) {
            const langCode = conv.languagePair.split('-')[0];
            setSelectedLanguage(langCode);
          }
        }
      } catch (error) {
        logger.error('加载会话消息失败', error);
      } finally {
        if (!cancelled) setMessagesLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [activeConversationId]);

  const handleSend = async () => {
    if (!activeConversationId || !inputValue.trim() || isSending) return;

    setIsSending(true);
    const userContent = inputValue.trim();
    setInputValue('');

    // Optimistically add customer message
    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      conversationId: activeConversationId,
      role: 'customer',
      content: userContent,
      language: selectedLanguage,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const aiMsg = await api.sendMessage(activeConversationId, {
        content: userContent,
        language: selectedLanguage,
        targetLanguage: 'zh',
        scene: selectedScene,
        persona: selectedPersona,
      });

      // Remove temp message and add real ones
      setMessages((prev) => {
        const filtered = prev.filter((m) => !m.id.startsWith('temp-'));
        return [...filtered, aiMsg];
      });

      // Refresh conversation list to update timestamps
      const result = await api.getConversations({
        page: 1,
        pageSize: 20,
        language: languageFilter === 'all' ? undefined : languageFilter,
      });
      setConversations(result.items);
    } catch (error) {
      logger.error('发送消息失败', error);
      setMessages((prev) => prev.filter((m) => !m.id.startsWith('temp-')));
    } finally {
      setIsSending(false);
    }
  };

  const handleNewConversation = async () => {
    try {
      const conv = await api.createConversation({
        title: `新会话 ${new Date().toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
        languagePair: `${selectedLanguage}-zh`,
        meta: { customerName: '未知客户', channel: 'Shopee' },
      });
      setConversations((prev) => [conv, ...prev]);
      setActiveConversationId(conv.id);
      setMessages([]);
    } catch (error) {
      logger.error('创建会话失败', error);
    }
  };

  const handleSelectSuggestion = (text: string) => {
    setInputValue(text);
  };

  const latestAiMessage = [...messages].reverse().find((m) => m.role === 'assistant');
  const suggestions = latestAiMessage?.suggestions;

  return (
    <div className="flex h-[calc(100vh-60px)] bg-slate-50 overflow-hidden">
      {/* Left: Conversation List */}
      <div className="w-[280px] flex-shrink-0 border-r border-slate-200 bg-white flex flex-col">
        <div className="p-4 border-b border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              会话列表
            </h2>
            <Button size="sm" variant="default" onClick={handleNewConversation}>
              <Plus className="w-4 h-4" />
              新建
            </Button>
          </div>
          <Select value={languageFilter} onValueChange={setLanguageFilter}>
            <SelectTrigger size="sm" className="w-full">
              <SelectValue placeholder="全部语言" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部语言</SelectItem>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="flex-1">
          {conversationsLoading ? (
            <div className="p-3 space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-3 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <MessageCircle className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-sm">暂无会话</p>
            </div>
          ) : (
            <div className="py-1">
              {conversations.map((conv) => {
                const langInfo = getLangInfo(conv.languagePair);
                const isActive = conv.id === activeConversationId;
                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConversationId(conv.id)}
                    className={`w-full text-left px-3 py-3 border-b border-slate-100 transition-colors ${
                      isActive
                        ? 'bg-blue-50 border-l-2 border-l-blue-600'
                        : 'hover:bg-slate-50 border-l-2 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-sm font-medium text-slate-800 truncate flex-1">
                        {conv.meta?.customerName || conv.title}
                      </span>
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0 h-5 flex-shrink-0"
                      >
                        {langInfo.flag}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-500 truncate mb-1">
                      {conv.title}
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(conv.updatedAt)}
                      </span>
                      {conv.status === 'active' && (
                        <span className="flex items-center gap-1 text-emerald-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          进行中
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Middle: Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="h-14 px-6 border-b border-slate-200 bg-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">
                {activeConversation?.meta?.customerName ||
                  activeConversation?.title ||
                  '选择一个会话开始'}
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>{getLangInfo(activeConversation?.languagePair).flag}</span>
                <span>{getLangInfo(activeConversation?.languagePair).name}会话</span>
                <span>·</span>
                <span>{activeConversation?.meta?.channel || 'Shopee'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <Globe className="w-3 h-3 mr-1" />
              {activeConversation?.languagePair || 'vi-zh'}
            </Badge>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 bg-slate-50">
          <div className="p-6 space-y-4">
            {messagesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                    <Skeleton className="h-16 w-2/3 rounded-xl" />
                  </div>
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <MessageSquare className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-sm mb-1">暂无消息</p>
                <p className="text-xs">发送第一条消息开始对话</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isCustomer = msg.role === 'customer';
                const langInfo = getLangInfo(msg.language);
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isCustomer ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`max-w-[70%] ${isCustomer ? '' : 'text-right'}`}>
                      {isCustomer ? (
                        <>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
                              <User className="w-3.5 h-3.5 text-slate-500" />
                            </div>
                            <span className="text-xs text-slate-500">客户</span>
                            <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                              {langInfo.flag} {langInfo.name}
                            </Badge>
                          </div>
                          <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-slate-800 shadow-sm">
                            {msg.content}
                          </div>
                          {msg.translation && (
                            <div className="text-xs text-slate-400 mt-1 ml-8">
                              📝 {msg.translation}
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-end gap-2 mb-1">
                            <Badge
                              variant="default"
                              className="text-[10px] h-4 px-1.5 bg-cyan-500"
                            >
                              <Sparkles className="w-3 h-3 mr-0.5" />
                              AI 建议
                            </Badge>
                            <span className="text-xs text-slate-500">智能助手</span>
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                              <Bot className="w-3.5 h-3.5 text-white" />
                            </div>
                          </div>
                          <div className="bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm shadow-sm">
                            {msg.content}
                          </div>
                          {msg.translation && (
                            <div className="text-xs text-slate-400 mt-1 mr-8">
                              📝 {msg.translation}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            {isSending && (
              <div className="flex justify-end">
                <div className="bg-slate-200 rounded-2xl rounded-tr-sm px-4 py-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-slate-200 bg-white p-4 flex-shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">语言：</span>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger size="sm" className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">场景：</span>
              <Select value={selectedScene} onValueChange={setSelectedScene}>
                <SelectTrigger size="sm" className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCENES.map((scene) => (
                    <SelectItem key={scene.value} value={scene.value}>
                      {scene.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">角色：</span>
              <Select value={selectedPersona} onValueChange={setSelectedPersona}>
                <SelectTrigger size="sm" className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERSONAS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-end gap-2">
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`输入${getLangInfo(selectedLanguage).name}消息内容...`}
              className="resize-none min-h-[60px] max-h-32"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={!activeConversationId || isSending}
            />
            <Button
              onClick={handleSend}
              disabled={!activeConversationId || !inputValue.trim() || isSending}
              className="h-auto px-4 py-3"
            >
              <Send className="w-4 h-4" />
              发送
            </Button>
          </div>
        </div>
      </div>

      {/* Right: AI Suggestion Panel */}
      <div className="w-[300px] flex-shrink-0 border-l border-slate-200 bg-white flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-500" />
            AI 智能建议
          </h2>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-5">
            {/* Intent Recognition */}
            <Card className="shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-slate-200">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  意图识别
                </h3>
              </div>
              <div className="p-4">
                {latestAiMessage?.intent ? (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-800">
                        {latestAiMessage.intent}
                      </span>
                      <Badge variant="default" className="text-xs bg-emerald-500">
                        {((latestAiMessage.confidence ?? 0) * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div
                        className="bg-emerald-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${(latestAiMessage.confidence ?? 0) * 100}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-slate-400 text-center py-2">暂无识别结果</p>
                )}
              </div>
            </Card>

            {/* Suggested Replies */}
            <Card className="shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-indigo-600" />
                  建议回复
                </h3>
              </div>
              <div className="p-3 space-y-2">
                {suggestions?.replies && suggestions.replies.length > 0 ? (
                  suggestions.replies.map((reply, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectSuggestion(reply)}
                      className="w-full text-left p-3 bg-slate-50 hover:bg-blue-50 rounded-lg text-sm text-slate-700 transition-colors border border-transparent hover:border-blue-200 group"
                    >
                      <div className="flex items-start gap-2">
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-3">{reply}</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-slate-400 text-center py-4">暂无建议回复</p>
                )}
              </div>
            </Card>

            {/* Cultural Tips */}
            <Card className="shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-slate-200">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  文化提示
                </h3>
              </div>
              <div className="p-3 space-y-2 bg-amber-50/30">
                {suggestions?.culturalTips && suggestions.culturalTips.length > 0 ? (
                  suggestions.culturalTips.map((tip, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 leading-relaxed"
                    >
                      💡 {tip}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400 text-center py-4">暂无文化提示</p>
                )}
              </div>
            </Card>

            {/* Bargaining Strategy */}
            {suggestions?.bargainingStrategy && (
              <Card className="shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-gradient-to-r from-orange-50 to-rose-50 border-b border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-orange-500" />
                    议价策略
                  </h3>
                </div>
                <div className="p-4">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {suggestions.bargainingStrategy}
                  </p>
                </div>
              </Card>
            )}

            {!latestAiMessage && (
              <div className="text-center py-8 text-slate-400">
                <Bot className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">发送消息后</p>
                <p className="text-sm">AI 会给出智能建议</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
