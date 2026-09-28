import React, { useState } from 'react';
import { EmotionalExplosion, InvestigativeReport } from '../../types/stock';
import { useClipboard } from '../../hooks/useClipboard';
import {
  Flame,
  Copy,
  Check,
  FileText,
  Video,
  Share2,
  HelpCircle,
  Sparkles,
  MessageSquare,
  Clock,
} from 'lucide-react';

interface EmotionalMediaSectionProps {
  emotional?: EmotionalExplosion;
  viralTitles?: InvestigativeReport['viralTitles'];
  wechatArticle?: string;
  shortVideoScript?: InvestigativeReport['shortVideoScript'];
  socialPost?: string;
  complianceDisclaimer?: string;
}

export const EmotionalMediaSection: React.FC<EmotionalMediaSectionProps> = ({
  emotional,
  viralTitles = [],
  wechatArticle = '',
  shortVideoScript,
  socialPost = '',
  complianceDisclaimer,
}) => {
  const [channelTab, setChannelTab] = useState<'wechat' | 'video' | 'social'>('wechat');
  const { copy, isCopied } = useClipboard(2000);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-2.5">
          <span className="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 flex items-center justify-center font-black text-xs">
            04
          </span>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              第四步：用“大众情绪”引爆传播
            </h3>
            <p className="text-xs text-slate-400">
              拒绝枯燥晦涩黑话，直击大众愤怒痛点，通俗口语化表达与灵魂拷问
            </p>
          </div>
        </div>
      </div>

      {/* 情绪三连击卡片 */}
      {emotional && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-800/40 space-y-1.5">
            <span className="text-[11px] font-bold text-rose-400 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5" />
              大众怒火激发点
            </span>
            <p className="text-xs text-rose-100 font-medium leading-relaxed">
              {emotional.publicAngerTrigger}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 space-y-1.5">
            <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" />
              通俗口语化金句
            </span>
            <p className="text-xs text-amber-100 font-medium leading-relaxed">
              {emotional.colloquialPunchline}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-800/40 space-y-1.5">
            <span className="text-[11px] font-bold text-indigo-400 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" />
              终极灵魂拷问
            </span>
            <p className="text-xs text-indigo-100 font-medium leading-relaxed">
              {emotional.soulInterrogation}
            </p>
          </div>
        </div>
      )}

      {/* 爆款“疑问+反差”标题矩阵 */}
      {viralTitles && viralTitles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span className="flex items-center gap-1.5 text-amber-300">
              <Sparkles className="w-4 h-4 text-amber-400" />
              爆款“疑问+反差”标题矩阵
            </span>
            <span className="text-slate-500 text-[11px]">点击即可一键复制</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {viralTitles.map((t, idx) => (
              <div
                key={idx}
                onClick={() => copy(`title-${idx}`, t.title)}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group flex items-start justify-between gap-3"
              >
                <div className="space-y-1 flex-1">
                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-indigo-300">
                    {t.type}
                  </span>
                  <p className="text-xs font-bold text-slate-200 group-hover:text-white leading-snug">
                    {t.title}
                  </p>
                  <p className="text-[11px] text-slate-500">{t.hookStyle}</p>
                </div>
                <button
                  type="button"
                  className="p-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-400 group-hover:text-slate-200 shrink-0"
                  title="复制标题"
                >
                  {isCopied(`title-${idx}`) ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 多渠道宣发内容分发 */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setChannelTab('wechat')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                channelTab === 'wechat'
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>微信深度万字长文</span>
            </button>

            <button
              onClick={() => setChannelTab('video')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                channelTab === 'video'
                  ? 'bg-rose-600/30 text-rose-300 border border-rose-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>短视频分镜脚本（黄金前3秒）</span>
            </button>

            <button
              onClick={() => setChannelTab('social')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                channelTab === 'social'
                  ? 'bg-sky-600/30 text-sky-300 border border-sky-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>社交/雪球即时锐评</span>
            </button>
          </div>

          {/* 针对当前 Tab 的复制按钮 */}
          <button
            onClick={() => {
              if (channelTab === 'wechat') copy('tab-content', wechatArticle);
              else if (channelTab === 'video') copy('tab-content', JSON.stringify(shortVideoScript, null, 2));
              else copy('tab-content', socialPost);
            }}
            className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-xs font-medium text-slate-200 border border-slate-700 cursor-pointer"
          >
            {isCopied('tab-content') ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">已复制本篇</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>一键复制全文</span>
              </>
            )}
          </button>
        </div>

        {/* 微信万字深度长文 */}
        {channelTab === 'wechat' && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 font-serif text-xs leading-relaxed text-slate-300 whitespace-pre-wrap max-h-96 overflow-y-auto">
            {wechatArticle || '正在生成深度长文...'}
          </div>
        )}

        {/* 短视频分镜脚本 */}
        {channelTab === 'video' && shortVideoScript && (
          <div className="space-y-3">
            {/* 黄金前3秒钩子 */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-rose-950/40 to-amber-950/40 border border-rose-800/50 space-y-1">
              <span className="text-[11px] font-bold text-rose-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                黄金前3秒完播率钩子（Hook）
              </span>
              <p className="text-xs text-white font-bold leading-relaxed">
                {shortVideoScript.hook3s}
              </p>
            </div>

            {/* 分镜明细 */}
            <div className="space-y-2">
              {shortVideoScript.scenes.map((scene) => (
                <div key={scene.sceneNumber} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="font-bold text-white">镜头 {scene.sceneNumber} · {scene.duration}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-indigo-300">
                      {scene.emotionTag}
                    </span>
                  </div>
                  <div className="text-slate-300"><span className="text-slate-500">画面机位：</span>{scene.visual}</div>
                  <div className="text-amber-200/90 font-medium"><span className="text-slate-500">口播台词：</span>{scene.audio}</div>
                </div>
              ))}
            </div>

            {/* 结尾呼吁 */}
            {shortVideoScript.callToAction && (
              <div className="p-2.5 rounded-lg bg-slate-800/60 text-xs text-slate-300 text-center font-medium">
                📢 引导互动台词：{shortVideoScript.callToAction}
              </div>
            )}
          </div>
        )}

        {/* 社交动态帖 */}
        {channelTab === 'social' && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 text-xs leading-relaxed text-slate-200 whitespace-pre-wrap">
            {socialPost}
          </div>
        )}
      </div>

      {/* 合规说明与免责 */}
      {complianceDisclaimer && (
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 text-[11px] text-slate-500 leading-relaxed">
          {complianceDisclaimer}
        </div>
      )}
    </div>
  );
};
