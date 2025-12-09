

import React, { useState, useRef, useEffect } from 'react';
import { ApiKeySelector } from './components/ApiKeySelector';
import { PromptDisplay } from './components/PromptDisplay';
import { UnifiedCommandConsole } from './components/UnifiedCommandConsole';
import { SlideEditorGrid } from './components/SlideEditorGrid';
import { CampaignModal } from './components/CampaignModal';
import { AppGuideAssistant } from './components/AppGuideAssistant';
import { rewritePromptService, generateInfographicImage, generateSlideDeckPrompts, transformSlideImageToPrompt, generateMCScripts, generateTimeBasedSlideDeck, regeneratePromptFromContent, optimizeSlidePromptWithVerification, optimizeThumbnailPrompt, autoFixPrompt } from './services/geminiService';
import { getExchangeRate } from './services/exchangeRateService';
import { overlayLogo, overlayAvatar } from './utils/imageProcessor';
import { exportToPDF, exportToPPTX, downloadAllImagesAsZip, exportPromptsToTxt } from './utils/documentExporter';
import { exportSafeSequencedPrompts } from './utils/safeExporter_v2';
import { convertPdfToImages } from './utils/pdfProcessor';
import { REFERENCE_PROMPT, LIMES_LOGO_SVG, SOCIAL_LINKS, BASE_PRICE_IMAGE_USD, BASE_PRICE_FLASH_CALL_USD, BASE_PRICE_FLASH_CALL_USD as BASE_PRICE_FLASH_CALL_USD_ALIAS, BASE_PRICE_FLUX_USD, MC_AGES, MC_GENRES, MC_NATIONALITIES } from './constants';
import { AppStatus, AspectRatioType, GenerationMode, Slide, MCAgeGroup, MCGenre, MCScene, MCNationality, ContentMode, ConsoleData, BatchStatus } from './types';
import { Droplets, ArrowRight, Image as ImageIcon, Download, Copy, RefreshCw, Check, ChevronDown, Sparkles, Presentation, Layers, Upload, FileText, X, Edit3, Repeat, FileIcon, Youtube, Facebook, Video, MessageCircle, Square, CircleStop, Mic2, Users, Monitor, Globe, RectangleHorizontal, Clock, FolderArchive, Clapperboard, MessageSquarePlus, ShieldPlus, ListOrdered, Wand, Shield, Layout, Home, ShieldCheck, Activity, Play, Pause, Coins, Wallet, Calculator, TrendingUp } from 'lucide-react';

const STORAGE_KEY = 'VIEN_Y_HOC_APP_STATE_V2';

const App: React.FC = () => {
  const [keyReady, setKeyReady] = useState(false);
  const [showKeySelector, setShowKeySelector] = useState(false); 
  const [topic, setTopic] = useState('');
  
  // Mode State
  const [mode, setMode] = useState<GenerationMode>('SINGLE');
  const [batchStatus, setBatchStatus] = useState<BatchStatus>('IDLE');

  // Single Image State
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Slide Deck / Remake State
  const [slides, setSlides] = useState<Slide[]>([]);
  const [selectedSlideId, setSelectedSlideId] = useState<number | null>(null);

  // New State for Time-based Slide Deck and Content Control
  const [isTimeBasedSlide, setIsTimeBasedSlide] = useState(false);
  const [scriptContent, setScriptContent] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number>(5);
  // NEW: TimeBased Generation Mode (Auto vs Fixed Count)
  const [timeBasedMode, setTimeBasedMode] = useState<'AUTO_32S' | 'FIXED_COUNT'>('AUTO_32S');

  // NEW STATES FOR SLIDE DECK
  const [slideCount, setSlideCount] = useState<number>(5);
  const [contentMode, setContentMode] = useState<ContentMode>('CREATIVE');

  // MC Studio State
  const [mcAge, setMcAge] = useState<MCAgeGroup>('Thiếu niên');
  const [mcGenre, setMcGenre] = useState<MCGenre>('Giáo dục');
  const [mcNationality, setMcNationality] = useState<MCNationality>('VN');
  const [mcProjectorImage, setMcProjectorImage] = useState<string | null>(null);
  const [mcScenes, setMcScenes] = useState<{intro: MCScene, outro: MCScene}>({
      intro: { type: 'INTRO', title: 'Giới thiệu (Intro)', script: '', visualPrompt: '', videoPrompt: '', imageUrl: null, status: 'IDLE' },
      outro: { type: 'OUTRO', title: 'Kêu gọi (Outro)', script: '', visualPrompt: '', videoPrompt: '', imageUrl: null, status: 'IDLE' }
  });

  // Thumbnail State
  const [thumbnailAvatar, setThumbnailAvatar] = useState<string | null>(null);
  const [avatarName, setAvatarName] = useState<string>(''); 
  const [subtitle, setSubtitle] = useState<string>(''); // NEW: Subtitle State

  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioType>("16:9"); 
  const [includeLogo, setIncludeLogo] = useState(true);
  const [customLogo, setCustomLogo] = useState<string | null>(null);
  
  // New State for Header Logo (App Logo)
  const [headerLogo, setHeaderLogo] = useState<string | null>(null);
  
  // State for Reference Image (Style Transfer)
  const [referenceImage, setReferenceImage] = useState<string | null>(null);

  // NEW: Split text color state - DEFAULT CHANGED TO BLACK
  const [titleColor, setTitleColor] = useState<string>('gold');
  const [bodyColor, setBodyColor] = useState<string>('black');
  
  // UI States
  const [isCopied, setIsCopied] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUpdatingContent, setIsUpdatingContent] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  
  // BILLING STATE (REAL-TIME DYNAMIC)
  const [accumulatedCost, setAccumulatedCost] = useState<number>(0);
  const [currentExchangeRate, setCurrentExchangeRate] = useState<number>(0);

  // REGENERATION MODAL STATE
  const [regenModal, setRegenModal] = useState<{
      isOpen: boolean;
      targetId: number | 'SINGLE' | 'INTRO' | 'OUTRO' | null;
      currentFeedback: string;
  }>({ isOpen: false, targetId: null, currentFeedback: '' });

  // COMMAND CONSOLE STATE
  const [consoleState, setConsoleState] = useState<{
    isOpen: boolean;
    data: ConsoleData;
    targetId: number | 'SINGLE' | null; 
  }>({
    isOpen: false,
    data: { title: '', body: '', subtitle: '', visualPrompt: '', mode: 'SINGLE' },
    targetId: null
  });
  
  const [uploadedFileCount, setUploadedFileCount] = useState(0);
  const [requestCount, setRequestCount] = useState(0);

  // Stop Signal Ref
  const abortGenRef = useRef(false);
  const isResettingRef = useRef(false);

  // --- INIT EXCHANGE RATE ---
  useEffect(() => {
     const initRate = async () => {
         const rate = await getExchangeRate();
         setCurrentExchangeRate(rate);
     };
     initRate();
  }, []);

  // --- DYNAMIC COST CALCULATOR ---
  // Updated to handle both engines
  const getDynamicCost = (type: 'IMAGE_GOOGLE' | 'IMAGE_FLUX' | 'FLASH') => {
      let basePrice = 0;
      if (type === 'IMAGE_GOOGLE') basePrice = BASE_PRICE_IMAGE_USD;
      else if (type === 'IMAGE_FLUX') basePrice = BASE_PRICE_FLUX_USD;
      else basePrice = BASE_PRICE_FLASH_CALL_USD;

      const rate = currentExchangeRate || 25500; // Safe fallback if state not yet updated
      return Math.ceil(basePrice * rate);
  };

  // Default display price (Lowest estimate)
  const currentUnitPrice = getDynamicCost('IMAGE_FLUX');

  // --- AUTO LOAD DATA ON MOUNT ---
  useEffect(() => {
    const loadState = () => {
      try {
        const savedState = localStorage.getItem(STORAGE_KEY);
        if (savedState) {
          const parsed = JSON.parse(savedState);
          
          const safeString = (val: any): string => {
              if (!val) return '';
              if (typeof val === 'string') return val;
              if (typeof val === 'object') return JSON.stringify(val);
              return String(val);
          };

          if (parsed.topic) setTopic(safeString(parsed.topic));
          if (parsed.mode) setMode(parsed.mode);
          if (parsed.generatedPrompt) setGeneratedPrompt(safeString(parsed.generatedPrompt));
          if (parsed.subtitle) setSubtitle(safeString(parsed.subtitle));
          if (parsed.accumulatedCost) setAccumulatedCost(parsed.accumulatedCost);
          
          if (parsed.slides) {
              const sanitizedSlides = parsed.slides.map((s: any) => ({
                  ...s,
                  content: safeString(s.content),
                  prompt: safeString(s.prompt),
                  title: safeString(s.title)
              }));
              setSlides(sanitizedSlides);
          }

          if (parsed.batchStatus) setBatchStatus(parsed.batchStatus);
          if (parsed.isTimeBasedSlide !== undefined) setIsTimeBasedSlide(parsed.isTimeBasedSlide);
          if (parsed.scriptContent) setScriptContent(safeString(parsed.scriptContent));
          if (parsed.durationMinutes) setDurationMinutes(parsed.durationMinutes);
          if (parsed.slideCount) setSlideCount(parsed.slideCount);
          if (parsed.contentMode) setContentMode(parsed.contentMode);
          if (parsed.timeBasedMode) setTimeBasedMode(parsed.timeBasedMode);
          
          if (parsed.mcAge) setMcAge(parsed.mcAge);
          if (parsed.mcGenre) setMcGenre(parsed.mcGenre);
          if (parsed.mcNationality) setMcNationality(parsed.mcNationality);
          
          if (parsed.mcScenes) {
              const sanitizedScenes = {
                  intro: { 
                      ...parsed.mcScenes.intro, 
                      script: safeString(parsed.mcScenes.intro.script),
                      visualPrompt: safeString(parsed.mcScenes.intro.visualPrompt),
                      videoPrompt: safeString(parsed.mcScenes.intro.videoPrompt)
                  },
                  outro: { 
                      ...parsed.mcScenes.outro, 
                      script: safeString(parsed.mcScenes.outro.script),
                      visualPrompt: safeString(parsed.mcScenes.outro.visualPrompt),
                      videoPrompt: safeString(parsed.mcScenes.outro.videoPrompt)
                  }
              };
              setMcScenes(sanitizedScenes);
          }
          
          if (parsed.avatarName) setAvatarName(safeString(parsed.avatarName));
          if (parsed.aspectRatio) setAspectRatio(parsed.aspectRatio);
          if (parsed.includeLogo !== undefined) setIncludeLogo(parsed.includeLogo);
          if (parsed.titleColor) setTitleColor(parsed.titleColor);
          if (parsed.bodyColor) setBodyColor(parsed.bodyColor);

          if (parsed.status && parsed.status === AppStatus.COMPLETED) {
             setStatus(AppStatus.PROMPT_READY);
          } else if (parsed.status) {
             setStatus(parsed.status);
          }
          if (parsed.selectedSlideId) setSelectedSlideId(parsed.selectedSlideId);
          
          console.log("Session restored from LocalStorage");
        }
      } catch (e) {
        console.error("Failed to load saved state", e);
        localStorage.removeItem(STORAGE_KEY);
      }
    };
    
    loadState();
  }, []);

  // --- AUTO SAVE DATA ---
  useEffect(() => {
    if (isResettingRef.current) return;

    const saveTimeout = setTimeout(() => {
      // OPTIMIZATION: Do not save heavy base64 images
      const lightSlides = slides.map(s => ({
          ...s,
          imageUrl: null,
          originalImage: null
      }));

      const lightMcScenes = {
          intro: { ...mcScenes.intro, imageUrl: null },
          outro: { ...mcScenes.outro, imageUrl: null }
      };

      const stateToSave = {
        topic,
        mode,
        generatedPrompt,
        subtitle,
        imageUrl: null,
        slides: lightSlides,
        batchStatus,
        isTimeBasedSlide,
        scriptContent,
        durationMinutes,
        slideCount,
        contentMode,
        timeBasedMode,
        mcAge,
        mcGenre,
        mcNationality,
        mcProjectorImage: null,
        mcScenes: lightMcScenes,
        thumbnailAvatar: null,
        avatarName,
        aspectRatio,
        includeLogo,
        customLogo: null,
        headerLogo: null,
        referenceImage: null,
        titleColor,
        bodyColor,
        status: status === AppStatus.GENERATING_IMAGE ? AppStatus.PROMPT_READY : status,
        selectedSlideId,
        accumulatedCost
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
      } catch (e) {
        console.warn("LocalStorage quota exceeded.", e);
      }
    }, 1000);

    return () => clearTimeout(saveTimeout);
  }, [
    topic, mode, generatedPrompt, subtitle, slides, batchStatus, isTimeBasedSlide, scriptContent, 
    durationMinutes, slideCount, contentMode, timeBasedMode, mcAge, mcGenre, mcNationality, 
    mcScenes, avatarName, aspectRatio, 
    includeLogo, titleColor, bodyColor, status, selectedSlideId, accumulatedCost
  ]);

  const handleKeySelected = () => {
    setKeyReady(true);
    setShowKeySelector(false); 
  };

  const handleChangeApiKey = () => {
      setShowKeySelector(true);
  };

  // HANDLER: Force Key Reset on Permission Denied
  const handlePermissionDenied = () => {
      setError("Lỗi quyền truy cập (Permission Denied). Vui lòng chọn lại API Key có liên kết thanh toán.");
      // Clear legacy key
      sessionStorage.removeItem('GEMINI_API_KEY');
      // Force "Change Key" mode (keyReady=true keeps app visible, but modal overlays it)
      setShowKeySelector(true);
  };

  const incrementRequestCount = (amount: number = 1) => {
      setRequestCount(prev => prev + amount);
  };
  
  const addCost = (amount: number) => {
      setAccumulatedCost(prev => prev + amount);
  };

  const handleCreatePrompt = async () => {
    if (mode === 'SLIDE_DECK' && isTimeBasedSlide) {
         if (!scriptContent.trim()) {
             setError("Vui lòng nhập nội dung kịch bản.");
             return;
         }
    } else {
         if (!topic.trim()) return;
    }

    setStatus(AppStatus.GENERATING_PROMPT);
    setError(null);
    setImageUrl(null);
    setSlides([]);
    setSelectedSlideId(null);
    setBatchStatus('IDLE');

    try {
      if (mode === 'SINGLE' || mode === 'THUMBNAIL') {
        incrementRequestCount();
        addCost(getDynamicCost('FLASH'));
        if (mode === 'THUMBNAIL') {
             const optimized = await optimizeThumbnailPrompt(topic, !!thumbnailAvatar);
             setGeneratedPrompt(optimized);
        } else {
             const refinedPrompt = await rewritePromptService(topic);
             setGeneratedPrompt(refinedPrompt);
        }
        setStatus(AppStatus.PROMPT_READY);
      } else if (mode === 'SLIDE_DECK') {
        incrementRequestCount();
        addCost(getDynamicCost('FLASH'));
        if (isTimeBasedSlide) {
            const customCount = timeBasedMode === 'FIXED_COUNT' ? slideCount : undefined;
            const generatedSlides = await generateTimeBasedSlideDeck(scriptContent, durationMinutes, customCount);
            setSlides(generatedSlides);
            if (generatedSlides.length > 0) setSelectedSlideId(generatedSlides[0].id);
        } else {
            const generatedSlides = await generateSlideDeckPrompts(topic, slideCount, contentMode);
            setSlides(generatedSlides);
            if (generatedSlides.length > 0) setSelectedSlideId(generatedSlides[0].id);
        }
        // FOR BATCH PROCESSING: Transition to REVIEW instead of Ready
        setStatus(AppStatus.PROMPT_READY);
        setBatchStatus('REVIEW'); // CRITICAL: Go to Review Mode

      } else if (mode === 'MC_STUDIO') {
          incrementRequestCount();
          addCost(getDynamicCost('FLASH'));
          const scripts = await generateMCScripts(topic, mcAge, mcGenre, mcNationality);
          setMcScenes({
              intro: { ...mcScenes.intro, script: scripts.intro.script, visualPrompt: scripts.intro.visualPrompt, videoPrompt: scripts.intro.videoPrompt || "", status: 'IDLE' },
              outro: { ...mcScenes.outro, script: scripts.outro.script, visualPrompt: scripts.outro.visualPrompt, videoPrompt: scripts.outro.videoPrompt || "", status: 'IDLE' }
          });
          setStatus(AppStatus.PROMPT_READY);
      }
    } catch (err: any) {
      if (err.message === "DAILY_QUOTA_EXCEEDED") {
          setError("Đã hết hạn mức tạo nội dung trong ngày. Vui lòng đổi API Key mới.");
      } else if (err.message === "PERMISSION_DENIED") {
          handlePermissionDenied();
      } else {
          setError(err.message || "Không thể tạo nội dung. Vui lòng thử lại.");
      }
      setStatus(AppStatus.ERROR);
    }
  };

  // UPDATED: Handle updates from Grid Editor
  const handleGridSlideUpdate = (id: number, newTitle: string, newContent: string) => {
      setSlides(prev => prev.map(s => s.id === id ? { ...s, title: newTitle, content: newContent, isOptimized: false } : s));
  };

  // SEQUENTIAL BATCH PROCESSOR
  const handleRunBatch = async () => {
      const slidesToProcess = slides.filter(s => !s.imageUrl || s.status === 'ERROR');
      if (slidesToProcess.length === 0) {
          alert("Tất cả slide đã được xử lý.");
          return;
      }

      setBatchStatus('PROCESSING');
      setStatus(AppStatus.GENERATING_IMAGE);
      abortGenRef.current = false;
      
      const newSlides = [...slides];
      const logoToUse = customLogo || LIMES_LOGO_SVG;

      for (let i = 0; i < newSlides.length; i++) {
          if (abortGenRef.current) break;
          
          const slide = newSlides[i];
          if (slide.imageUrl && slide.status !== 'ERROR') continue; // Skip if done

          // Update Status to Generating
          newSlides[i] = { ...slide, status: 'GENERATING' };
          setSlides([...newSlides]);
          setSelectedSlideId(slide.id);

          try {
              if (i > 0) await delay(500); // Slight delay

              incrementRequestCount();
              
              const currentPrompt = slide.prompt || "Infographic";
              const promptToRun = appendTextColorPrompt(currentPrompt);

              let refImageForThisSlide = referenceImage;
              if (mode === 'REMAKE_SLIDE' && slide.originalImage) {
                  refImageForThisSlide = slide.originalImage;
              }

              // GENERATE
              // Updated to handle object return { url, engine }
              const result = await generateInfographicImage(
                  promptToRun, 
                  aspectRatio, 
                  refImageForThisSlide, 
                  null, 
                  undefined,
                  { title: slide.title, body: slide.content }, // FORCE VERBATIM TEXT FROM GRID EDITOR
                  'SLIDE_DECK'
              );

              let url = result.url;
              if (includeLogo) {
                  url = await overlayLogo(url, logoToUse);
              }

              // Update Success State & Cost
              // Determine cost based on engine used
              const costType = result.engine === 'FLUX' ? 'IMAGE_FLUX' : 'IMAGE_GOOGLE';
              addCost(getDynamicCost(costType));
              
              newSlides[i] = { ...newSlides[i], imageUrl: url, status: 'COMPLETED' };
              setSlides([...newSlides]);

          } catch (err: any) {
              console.error(`Error on slide ${slide.id}`, err);
              newSlides[i] = { ...slide, status: 'ERROR' };
              setSlides([...newSlides]);

              if (err.message === "DAILY_QUOTA_EXCEEDED") {
                  setError("Hết hạn ngạch. Batch bị dừng.");
                  abortGenRef.current = true;
                  break;
              } else if (err.message === "PERMISSION_DENIED") {
                  handlePermissionDenied();
                  abortGenRef.current = true;
                  break;
              }
          }
      }

      setBatchStatus(abortGenRef.current ? 'PAUSED' : 'COMPLETED');
      setStatus(AppStatus.COMPLETED);
  };

  const handlePauseBatch = () => {
      abortGenRef.current = true;
  };

  const handleOpenRegenerate = (targetId: number | 'SINGLE' | 'INTRO' | 'OUTRO') => {
      setRegenModal({ isOpen: true, targetId: targetId, currentFeedback: '' });
  };

  const handleConfirmRegenerate = async () => {
      const { targetId, currentFeedback } = regenModal;
      setRegenModal({ ...regenModal, isOpen: false }); 

      if (currentFeedback.trim()) {
          setStatus(AppStatus.GENERATING_PROMPT); 
          try {
              let originalPrompt = "";
              let contextMode = 'GENERAL';

              if (targetId === 'SINGLE') {
                  originalPrompt = generatedPrompt;
                  contextMode = mode;
              } else if (typeof targetId === 'number') {
                  const slide = slides.find(s => s.id === targetId);
                  originalPrompt = slide?.prompt || "";
                  contextMode = 'SLIDE_DECK';
              } else if (targetId === 'INTRO' || targetId === 'OUTRO') {
                  const scene = mcScenes[targetId === 'INTRO' ? 'intro' : 'outro'];
                  originalPrompt = scene.visualPrompt || "";
                  contextMode = 'MC_STUDIO';
              }

              if (originalPrompt) {
                  incrementRequestCount();
                  addCost(getDynamicCost('FLASH'));
                  const fixedPrompt = await autoFixPrompt(originalPrompt, currentFeedback, contextMode);
                  
                  if (targetId === 'SINGLE') {
                      setGeneratedPrompt(fixedPrompt);
                      handleGenerateImage(currentFeedback, fixedPrompt); 
                  } else if (typeof targetId === 'number') {
                      setSlides(prev => prev.map(s => s.id === targetId ? { ...s, prompt: fixedPrompt } : s));
                      handleRegenerateSlide(targetId, currentFeedback, fixedPrompt);
                  } else if (targetId === 'INTRO' || targetId === 'OUTRO') {
                      // UPDATE STATE AND TRIGGER GENERATION FOR MC STUDIO
                      setMcScenes(prev => ({
                          ...prev,
                          [targetId === 'INTRO' ? 'intro' : 'outro']: { 
                              ...prev[targetId === 'INTRO' ? 'intro' : 'outro'], 
                              visualPrompt: fixedPrompt 
                          }
                      }));
                      handleGenerateMCImage(targetId, currentFeedback, fixedPrompt);
                  }
              } else {
                   if (targetId === 'SINGLE') handleGenerateImage(currentFeedback);
                   else if (targetId === 'INTRO' || targetId === 'OUTRO') handleGenerateMCImage(targetId, currentFeedback);
                   else if (typeof targetId === 'number') handleRegenerateSlide(targetId, currentFeedback);
              }
          } catch (e: any) {
              console.error("Auto-fix failed", e);
              if (e.message === "PERMISSION_DENIED") {
                  handlePermissionDenied();
              } else {
                  if (targetId === 'SINGLE') handleGenerateImage(currentFeedback);
                  else if (targetId === 'INTRO' || targetId === 'OUTRO') handleGenerateMCImage(targetId, currentFeedback);
                  else if (typeof targetId === 'number') handleRegenerateSlide(targetId, currentFeedback);
              }
          }
      } else {
          if (targetId === 'SINGLE') handleGenerateImage(currentFeedback);
          else if (targetId === 'INTRO' || targetId === 'OUTRO') handleGenerateMCImage(targetId, currentFeedback);
          else if (typeof targetId === 'number') handleRegenerateSlide(targetId, currentFeedback);
      }
  };

  const handleGenerateMCImage = async (sceneType: 'INTRO' | 'OUTRO', feedback: string = '', overridePrompt?: string) => {
      const sceneKey = sceneType === 'INTRO' ? 'intro' : 'outro';
      const scene = mcScenes[sceneKey];
      
      setMcScenes(prev => ({
          ...prev,
          [sceneKey]: { ...prev[sceneKey], status: 'GENERATING' }
      }));
      setError(null);

      try {
          incrementRequestCount();
          const logoToUse = customLogo || LIMES_LOGO_SVG;
          const screenDirective = mcProjectorImage 
            ? " . IMPORTANT: The Large Background Screen contains the SPECIFIC IMAGE provided in the input. DO NOT generate new graphics for the screen." 
            : ` . Background Screen displays '${topic}' Eco-Water visualizations.`;

          const promptBase = overridePrompt || scene.visualPrompt;
          let finalPrompt = `${promptBase} . Hyper-realistic 8k Photography. Professional News Studio Physical Set. Clean air. Soft Cinematic Lighting.${screenDirective}`;
          
          let refImgToUse = referenceImage;
          if (sceneType === 'OUTRO' && mcScenes.intro.imageUrl) {
              refImgToUse = mcScenes.intro.imageUrl; 
          }

          // Updated to handle object return
          const result = await generateInfographicImage(finalPrompt, aspectRatio, refImgToUse, mcProjectorImage, feedback, undefined, 'MC_STUDIO');
          
          let url = result.url;
          if (includeLogo) {
              url = await overlayLogo(url, logoToUse);
          }
          
          const costType = result.engine === 'FLUX' ? 'IMAGE_FLUX' : 'IMAGE_GOOGLE';
          addCost(getDynamicCost(costType));

          setMcScenes(prev => ({
              ...prev,
              [sceneKey]: { ...prev[sceneKey], imageUrl: url, status: 'COMPLETED', visualPrompt: promptBase }
          }));

      } catch (err: any) {
          setMcScenes(prev => ({
              ...prev,
              [sceneKey]: { ...prev[sceneKey], status: 'ERROR' }
          }));
          if (err.message === "DAILY_QUOTA_EXCEEDED") {
              setError("Đã hết hạn mức tạo ảnh MC trong ngày (Daily Quota). Vui lòng đổi API Key mới (Nút khiên ở menu) để tiếp tục.");
          } else if (err.message === "PERMISSION_DENIED") {
              handlePermissionDenied();
          } else {
              setError(`Lỗi tạo ảnh MC: ${err.message}`);
          }
      }
  };
  
  const handleUpdateMCScript = (sceneType: 'INTRO' | 'OUTRO', newPrompt: string) => {
       const sceneKey = sceneType === 'INTRO' ? 'intro' : 'outro';
       setMcScenes(prev => ({
          ...prev,
          [sceneKey]: { ...prev[sceneKey], visualPrompt: newPrompt }
       }));
  };
  
  const handleProjectorImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setMcProjectorImage(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleUseSamplePrompt = () => {
    setMode('SINGLE');
    setGeneratedPrompt(REFERENCE_PROMPT);
    setStatus(AppStatus.PROMPT_READY);
    setError(null);
    setImageUrl(null);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleHeaderLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setHeaderLogo(result);
        setCustomLogo(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveCustomLogo = () => {
    setCustomLogo(null);
  };
  
  const handleReferenceImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setReferenceImage(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };
  
  const handleRemoveReferenceImage = () => {
      setReferenceImage(null);
  };

  const handleThumbnailAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setThumbnailAvatar(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleRemoveThumbnailAvatar = () => {
      setThumbnailAvatar(null);
      setAvatarName('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      setStatus(AppStatus.GENERATING_PROMPT);
      setError(null);
      setSlides([]);
      setBatchStatus('REVIEW'); // Jump to Review directly for PDF processing
      
      const newSlides: Slide[] = [];
      let slideCounter = 1;

      try {
          for (let i = 0; i < files.length; i++) {
              const file = files[i];
              
              if (file.type === 'application/pdf') {
                  const pdfImages = await convertPdfToImages(file);
                  for (const base64 of pdfImages) {
                       incrementRequestCount();
                       addCost(getDynamicCost('FLASH'));
                       const result = await transformSlideImageToPrompt(base64);
                       newSlides.push({
                           id: slideCounter++,
                           ...result,
                           imageUrl: null,
                           originalImage: base64,
                           status: 'PENDING'
                       });
                  }
              } else if (file.type.startsWith('image/')) {
                  const base64 = await new Promise<string>((resolve) => {
                      const reader = new FileReader();
                      reader.onloadend = () => resolve(reader.result as string);
                      reader.readAsDataURL(file);
                  });
                  incrementRequestCount();
                  addCost(getDynamicCost('FLASH'));
                  const result = await transformSlideImageToPrompt(base64);
                  newSlides.push({
                      id: slideCounter++,
                      ...result,
                      imageUrl: null,
                      originalImage: base64,
                      status: 'PENDING'
                  });
              }
          }
          
          setSlides(newSlides);
          setUploadedFileCount(newSlides.length);
          if (newSlides.length > 0) setSelectedSlideId(1);
          setStatus(AppStatus.PROMPT_READY);

      } catch (err: any) {
          console.error(err);
          if (err.message === "DAILY_QUOTA_EXCEEDED") {
              setError("Đã hết hạn mức tạo nội dung trong ngày (Text Model). Vui lòng đổi API Key mới.");
          } else if (err.message === "PERMISSION_DENIED") {
              handlePermissionDenied();
          } else {
              setError("Lỗi khi xử lý file (PDF/Ảnh). Vui lòng thử lại.");
          }
          setStatus(AppStatus.ERROR);
      }
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const getColorDesc = (color: string) => {
      switch (color) {
          case 'white': return "bright WHITE";
          case 'black': return "deep BLACK";
          case 'gold': return "glowing GOLD";
          case 'navy': return "dark NAVY BLUE";
          case 'red': return "vibrant RED";
          case 'purple': return "rich PURPLE";
          default: return color;
      }
  };

  const appendTextColorPrompt = (originalPrompt: string) => {
      // STEEL COMMAND: Enforce specific colors regardless of UI choice if needed, 
      // but respecting the "Style" variables for user flexibility.
      // HOWEVER, based on user request, we enforce "Gold Title" and "Black Body" strongly.
      // UPDATED: Added "chữ ghi trên ảnh chính xác chữ tiếng việt" as strictly requested before content.
      
      const colorInstruction = `STRICT TEXT COLOR & RENDER RULES (LUẬT THÉP):
      1. **TITLE (TIÊU ĐỀ)**: MUST be 3D GOLDEN YELLOW (Vàng Ánh Kim), Massive 3D Block Letters, Glossy/Shiny finish. High Contrast.
      2. **BODY TEXT (NỘI DUNG)**: MUST be DEEP BLACK (Đen Đậm), Bold, and Sharp. **ABSOLUTELY NO WHITE TEXT**.
      3. **HIGHLIGHTS**: Automatically colorize KEYWORDS based on urgency/importance: RED (Critical), BLUE (Trust), PURPLE (Wisdom), ORANGE (Action).
      4. **VIETNAMESE TEXT ACCURACY**: chữ ghi trên ảnh chính xác chữ tiếng việt. TEXT MUST BE RENDERED EXACTLY AS PROVIDED (VERBATIM). NO SPELLING ERRORS. NO TRANSLATION.
      5. **VISUALS**: 3D Eco-style elements, Water/Nature theme.
      `;
      
      // UPDATED RULE: Protect Top-Right Corner (Keep background color, NO TEXT)
      let safeZoneDesc = "LAYOUT RULE: The TOP-RIGHT corner (approx 20%) is RESERVED for a Logo. 1. NO TEXT/TITLES in this area. 2. PRESERVE BACKGROUND COLOR in this area (Do NOT make it white/blank). Keep the nature/water theme consistent across the entire background.";
      
      if (mode === 'THUMBNAIL') {
          safeZoneDesc += " VIRAL THUMBNAIL STYLE: Ultra-high contrast, massive 3D text. SUBTITLE MUST BE LOWERCASE.";
          if (thumbnailAvatar) {
              safeZoneDesc += " IMPORTANT: Leave 30% space for character overlay.";
          }
      }

      return `${originalPrompt} . ${colorInstruction} . ${safeZoneDesc}`;
  };

  const handleStopGeneration = () => {
    abortGenRef.current = true;
    setStatus(AppStatus.COMPLETED); 
    setBatchStatus('PAUSED');
  };

  const handleOptimizeAllPrompts = async () => {
      if (slides.length === 0) return;
      setIsOptimizing(true);
      abortGenRef.current = false;
      const newSlides = [...slides];

      for (let i = 0; i < newSlides.length; i++) {
          if (abortGenRef.current) break;
          // Skip if already optimized to save time/cost, unless user forces a re-run
          // For sequential loop requested by user, we might want to ensure strict compliance
          if (newSlides[i].isOptimized) continue;

          // Visual Indicator that this slide is being processed
          newSlides[i] = { ...newSlides[i], status: 'GENERATING' }; 
          setSlides([...newSlides]);
          setSelectedSlideId(newSlides[i].id);

          try {
              incrementRequestCount();
              addCost(getDynamicCost('FLASH'));
              const optimizedPrompt = await optimizeSlidePromptWithVerification(
                  newSlides[i].title, 
                  newSlides[i].content,
                  titleColor,
                  bodyColor
              );
              newSlides[i] = { 
                  ...newSlides[i], 
                  prompt: optimizedPrompt, 
                  status: 'PENDING', 
                  isOptimized: true 
              };
              setSlides([...newSlides]);
          } catch (err: any) {
              console.error(`Error optimizing slide ${i+1}`, err);
              if (err.message === "PERMISSION_DENIED") {
                  handlePermissionDenied();
                  abortGenRef.current = true;
                  break;
              }
              newSlides[i] = { ...newSlides[i], status: 'PENDING' }; // Revert status
              setSlides([...newSlides]);
          }
          await delay(500); 
      }
      setIsOptimizing(false);
  };

  // REGENERATION FOR SINGLE SLIDE (with Cost Optimization)
  const handleRegenerateSlide = async (slideId: number, feedback: string = '', overridePrompt?: string) => {
      const slideIndex = slides.findIndex(s => s.id === slideId);
      if (slideIndex === -1) return;
      
      if (slides[slideIndex].status === 'GENERATING') return;
      
      const logoToUse = customLogo || LIMES_LOGO_SVG;

      const newSlides = [...slides];
      newSlides[slideIndex] = { ...newSlides[slideIndex], status: 'GENERATING' };
      setSlides(newSlides);
      setSelectedSlideId(slideId);
      
      setStatus(AppStatus.GENERATING_IMAGE);
      setError(null);

      try {
          incrementRequestCount();
          let refImageForThisSlide = referenceImage;
          if (mode === 'REMAKE_SLIDE' && newSlides[slideIndex].originalImage) {
              refImageForThisSlide = newSlides[slideIndex].originalImage;
          }

          const currentPrompt = overridePrompt || newSlides[slideIndex].prompt || "Infographic";
          const promptToRun = appendTextColorPrompt(currentPrompt);

          // Updated to handle object return
          const result = await generateInfographicImage(
              promptToRun, 
              aspectRatio, 
              refImageForThisSlide, 
              null, 
              feedback,
              { title: newSlides[slideIndex].title, body: newSlides[slideIndex].content },
              'SLIDE_DECK' 
          );

          let url = result.url;
          if (includeLogo) {
              url = await overlayLogo(url, logoToUse);
          }
          
          const costType = result.engine === 'FLUX' ? 'IMAGE_FLUX' : 'IMAGE_GOOGLE';
          addCost(getDynamicCost(costType));

          newSlides[slideIndex] = { ...newSlides[slideIndex], imageUrl: url, status: 'COMPLETED' };
          setSlides([...newSlides]);
          
          if (!newSlides.some(s => s.status === 'GENERATING')) {
              setStatus(AppStatus.COMPLETED);
          }
      } catch (err: any) {
          console.error(err);
          newSlides[slideIndex] = { ...newSlides[slideIndex], status: 'ERROR' };
          setSlides([...newSlides]);
          
          if (err.message === "DAILY_QUOTA_EXCEEDED") {
              setError("Đã hết hạn mức tạo ảnh trong ngày (Daily Quota). Vui lòng đổi API Key mới (Nút khiên ở menu) để tiếp tục.");
          } else if (err.message === "PERMISSION_DENIED") {
              handlePermissionDenied();
          } else {
              setError(`Lỗi tạo lại slide ${slideId}: ${err.message}`);
          }
          setStatus(AppStatus.COMPLETED); 
      }
  };

  const handleOpenConsole = () => {
      if (mode === 'SINGLE' || mode === 'THUMBNAIL') {
          setConsoleState({
              isOpen: true,
              data: {
                  title: topic, 
                  subtitle: subtitle, 
                  body: '', 
                  visualPrompt: generatedPrompt,
                  mode: mode
              },
              targetId: 'SINGLE'
          });
      }
  };

  const handleConsoleConfirm = (data: ConsoleData) => {
      setConsoleState({ ...consoleState, isOpen: false });
      if (consoleState.targetId === 'SINGLE') {
          setTopic(data.title);
          if (data.subtitle) setSubtitle(data.subtitle);
          setGeneratedPrompt(data.visualPrompt);
          handleGenerateImage('', data.visualPrompt, data.title, data.body, data.subtitle);
      }
  };

  const handleGenerateImage = async (feedback: string = '', overridePrompt?: string, overrideTitle?: string, overrideBody?: string, overrideSubtitle?: string) => {
    const safeFeedback = typeof feedback === 'string' ? feedback : '';
    abortGenRef.current = false;
    const logoToUse = customLogo || LIMES_LOGO_SVG;

    if (mode === 'SINGLE' || mode === 'THUMBNAIL') {
      if (!overridePrompt && !feedback) {
          handleOpenConsole();
          return;
      }

      const visualPromptToUse = overridePrompt || generatedPrompt;
      const titleToUse = overrideTitle || topic;
      const subtitleToUse = overrideSubtitle || subtitle;
      const bodyToUse = overrideBody || "";

      if (!visualPromptToUse.trim()) return;
      
      setStatus(AppStatus.GENERATING_IMAGE);
      setError(null);
      setIsCopied(false);

      try {
        let promptToRun = visualPromptToUse;
        promptToRun = appendTextColorPrompt(promptToRun);
        
        incrementRequestCount(); 
        
        const textOverlayPayload = { title: titleToUse, body: bodyToUse, subtitle: subtitleToUse };

        // Updated to handle object return
        const result = await generateInfographicImage(
            promptToRun, 
            aspectRatio, 
            referenceImage, 
            null, 
            safeFeedback,
            textOverlayPayload,
            mode
        );
        
        let url = result.url;
        if (mode === 'THUMBNAIL' && thumbnailAvatar) {
            url = await overlayAvatar(url, thumbnailAvatar, aspectRatio, avatarName);
        }

        if (includeLogo) {
          url = await overlayLogo(url, logoToUse);
        }
        
        const costType = result.engine === 'FLUX' ? 'IMAGE_FLUX' : 'IMAGE_GOOGLE';
        addCost(getDynamicCost(costType));

        if (abortGenRef.current) {
             setStatus(AppStatus.PROMPT_READY);
             return;
        }

        setImageUrl(url);
        setStatus(AppStatus.COMPLETED);
      } catch (err: any) {
        if (err.message === "DAILY_QUOTA_EXCEEDED") {
            setError("Đã hết hạn mức tạo ảnh trong ngày (Daily Quota). Vui lòng đổi API Key mới.");
        } else if (err.message === "PERMISSION_DENIED") {
            handlePermissionDenied();
        } else {
            setError(err.message || "Không thể tạo ảnh. Vui lòng thử lại.");
        }
        setStatus(AppStatus.ERROR);
      }
    } else {
        // Fallback or old method if Batch loop not used
        handleRunBatch();
    }
  };

  const resetApp = () => {
    if (confirm("Bạn có chắc muốn xóa toàn bộ dữ liệu hiện tại và làm mới?")) {
        isResettingRef.current = true;
        abortGenRef.current = true;
        localStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem('GEMINI_API_KEY');
        sessionStorage.clear();
        setTopic('');
        setSubtitle('');
        setSlides([]);
        setStatus(AppStatus.IDLE);
        setBatchStatus('IDLE');
        setAccumulatedCost(0);
        setTimeout(() => {
            window.location.reload();
        }, 100);
    }
  };
  
  const handleBackToMenu = () => {
      setMode('SINGLE'); 
      setGeneratedPrompt('');
      setSubtitle('');
      setSlides([]);
      setMcScenes({
          intro: { type: 'INTRO', title: 'Giới thiệu (Intro)', script: '', visualPrompt: '', videoPrompt: '', imageUrl: null, status: 'IDLE' },
          outro: { type: 'OUTRO', title: 'Kêu gọi (Outro)', script: '', visualPrompt: '', videoPrompt: '', imageUrl: null, status: 'IDLE' }
      });
      setStatus(AppStatus.IDLE);
      setBatchStatus('IDLE');
      setError(null);
  };

  const currentSlide = slides.find(s => s.id === selectedSlideId);
  const currentDisplayImage = (mode === 'SINGLE' || mode === 'THUMBNAIL') ? imageUrl : currentSlide?.imageUrl;
  const currentOriginalImage = mode === 'REMAKE_SLIDE' ? currentSlide?.originalImage : null;
  const currentDisplayPrompt = (mode === 'SINGLE' || mode === 'THUMBNAIL') ? generatedPrompt : currentSlide?.prompt || "";

  const handlePromptChange = (newVal: string) => {
    if (mode === 'SINGLE' || mode === 'THUMBNAIL') {
      setGeneratedPrompt(newVal);
    } else {
      if (selectedSlideId) {
        setSlides(slides.map(s => s.id === selectedSlideId ? { ...s, prompt: newVal } : s));
      }
    }
  };
  
  const handleContentUpdate = async (newTitle: string, newContent: string) => {
      if (!selectedSlideId) return;
      setIsUpdatingContent(true);
      try {
          setSlides(slides.map(s => s.id === selectedSlideId ? { 
              ...s, 
              title: newTitle, 
              content: newContent,
              isOptimized: false 
          } : s));
      } catch (err) {
          console.error("Failed to update content", err);
      } finally {
          setIsUpdatingContent(false);
          setShowEditModal(false);
      }
  };

  const handleCopyToClipboard = async () => {
    if (!currentDisplayImage) return;
    try {
      const response = await fetch(currentDisplayImage);
      const blob = await response.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      alert("Copy failed. Try downloading instead.");
    }
  };

  const handleDownload = (format: 'png' | 'jpg' | 'pdf' | 'pptx' | 'zip-png' | 'zip-jpg') => {
    if (format === 'pdf') { exportToPDF(slides, topic || "Bai_Giang_VienYHocSuSong"); setShowDownloadMenu(false); return; }
    if (format === 'pptx') { exportToPPTX(slides, topic || "Bai_Giang_VienYHocSuSong"); setShowDownloadMenu(false); return; }
    if (format === 'zip-png') { downloadAllImagesAsZip(slides, topic || "Bo_Anh_VienYHocSuSong", 'png'); setShowDownloadMenu(false); return; }
    if (format === 'zip-jpg') { downloadAllImagesAsZip(slides, topic || "Bo_Anh_VienYHocSuSong", 'jpg'); setShowDownloadMenu(false); return; }

    const imgToSave = currentDisplayImage;
    if (!imgToSave) return;
    
    if (format === 'png') {
      const a = document.createElement('a');
      a.href = imgToSave;
      a.download = `VienYHocSuSong-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          const jpgUrl = canvas.toDataURL('image/jpeg', 0.9);
          const a = document.createElement('a');
          a.href = jpgUrl;
          a.download = `VienYHocSuSong-${Date.now()}.jpg`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      };
      img.src = imgToSave;
    }
    setShowDownloadMenu(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden font-sans text-slate-800">
      <div className="fixed inset-0 bg-gradient-to-br from-[#E0F7FA] via-[#E1F5FE] to-[#FFFFFF] -z-20" />
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-200/20 blur-[100px] -z-10 animate-pulse" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-blue-200/20 blur-[80px] -z-10" />

      {/* Campaign Notification Overlay */}
      <CampaignModal />
      
      {/* App Guide Assistant - AI CHATBOT */}
      {keyReady && (
        <AppGuideAssistant currentMode={mode} accumulatedCost={accumulatedCost} />
      )}

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 py-4 md:py-6 flex flex-col min-h-screen">
        <header className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4 px-2">
          {/* LOGO */}
          <div className="flex items-center gap-4 backdrop-blur-sm bg-white/40 p-3 pr-6 rounded-3xl border border-white/60 shadow-lg hover:bg-white/60 transition-all group relative cursor-pointer hover:shadow-cyan-100 hover:scale-105 duration-300">
             <input type="file" accept="image/png, image/jpeg, image/svg+xml" onChange={handleHeaderLogoUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" title="Nhấn để thay đổi Logo" />
            <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center shadow-xl shadow-cyan-500/30 text-white overflow-hidden ring-4 ring-white ${headerLogo ? 'bg-white' : 'bg-gradient-to-tr from-cyan-400 to-blue-500'}`}>
              {headerLogo ? <img src={headerLogo} alt="App Logo" className="w-full h-full object-contain" /> : <Droplets className="w-8 h-8 md:w-10 md:h-10 animate-bounce-slow" />}
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-700 tracking-tight leading-none group-hover:text-cyan-700 transition-colors">Viện Y Học<br/>Sự Sống</h1>
              <p className="text-[10px] md:text-xs text-slate-500 font-bold tracking-widest uppercase mt-1 flex items-center gap-1">AI Generator <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full">Đổi Logo</span></p>
            </div>
          </div>

          {/* SOCIAL LINKS - CENTERED */}
          <div className="flex items-center gap-3 bg-white/40 backdrop-blur-md px-6 py-2 rounded-full border border-white/50 shadow-sm transition-all hover:bg-white/60">
              <a href={SOCIAL_LINKS.YOUTUBE} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-full hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors" title="YouTube"><Youtube className="w-5 h-5" /></a>
              <a href={SOCIAL_LINKS.FACEBOOK} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-full hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition-colors" title="Facebook"><Facebook className="w-5 h-5" /></a>
              <a href={SOCIAL_LINKS.TIKTOK} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-black transition-colors" title="TikTok"><Video className="w-5 h-5" /></a>
              <a href={SOCIAL_LINKS.ZALO} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-full hover:bg-blue-50 text-slate-500 hover:text-blue-500 transition-colors" title="Zalo"><MessageCircle className="w-5 h-5" /></a>
          </div>

          <div className="flex flex-col items-end gap-2">
             <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50/80 backdrop-blur-sm rounded-lg border border-yellow-200 shadow-sm text-xs font-mono" title="Tổng phí đã sử dụng">
                     <Coins className="w-4 h-4 text-yellow-600" />
                     <span className="text-yellow-700 font-bold">{accumulatedCost.toLocaleString()} VND</span>
                 </div>
                 {/* REAL-TIME RATE WIDGET */}
                 <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50/80 backdrop-blur-sm rounded-lg border border-green-200 shadow-sm text-xs font-mono" title="Tỷ giá & Đơn giá thời gian thực">
                     <TrendingUp className="w-4 h-4 text-green-600" />
                     <span className="text-green-700 font-bold">1 Ảnh ≈ {currentUnitPrice.toLocaleString()}đ</span>
                 </div>
             </div>
             <div className="flex items-center gap-3 md:gap-4">
                {status !== AppStatus.IDLE && (generatedPrompt || slides.length > 0 || mcScenes.intro.script) && (
                    <button onClick={handleBackToMenu} className="group flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/60 hover:bg-white border border-white/60 transition-all text-slate-600 shadow-sm hover:shadow-md hover:scale-105" title="Về Menu">
                        <Home className="w-5 h-5 text-indigo-600 group-hover:text-indigo-700" />
                        <span className="text-sm font-bold hidden sm:inline">Menu</span>
                    </button>
                )}
                <button onClick={handleChangeApiKey} className="group flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/60 hover:bg-white border border-white/60 transition-all text-slate-600 shadow-sm hover:shadow-md hover:scale-105" title="Đổi API Key">
                    <Shield className="w-5 h-5 text-green-600 group-hover:text-green-700" />
                    <span className="text-sm font-bold hidden sm:inline">Đổi Key</span>
                </button>
                <button onClick={resetApp} className="group flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/60 hover:bg-white border border-white/60 transition-all text-slate-600 shadow-sm hover:shadow-md hover:scale-105" title="Làm mới">
                <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform text-cyan-600" />
                <span className="text-sm font-bold hidden sm:inline">Tạo mới</span>
                </button>
             </div>
          </div>
        </header>

        <main className="flex-grow flex flex-col items-center justify-center w-full">
          {((status === AppStatus.IDLE || status === AppStatus.GENERATING_PROMPT || status === AppStatus.ERROR) && !generatedPrompt && slides.length === 0 && !mcScenes.intro.script) && (
             <div className="w-full max-w-4xl animate-fade-in-up flex flex-col items-center">
              <div className="text-center mb-8 relative w-full">
                <div className="absolute top-10 left-1/2 -translate-x-1/2 w-40 h-40 bg-yellow-200/40 blur-3xl rounded-full -z-10"></div>
                <h2 className="text-3xl md:text-5xl font-bold text-slate-800 mb-6 leading-tight">Hệ Thống Sáng Tạo <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600">Nội Dung Sinh Thái</span></h2>
                <div className="flex flex-wrap justify-center gap-2 mb-8 p-1.5 bg-white/40 backdrop-blur-md rounded-2xl border border-white/50 w-fit mx-auto shadow-sm">
                  {[ { id: 'SINGLE', label: 'Tạo Ảnh Đơn', icon: ImageIcon }, { id: 'THUMBNAIL', label: 'Tạo Thumbnail', icon: RectangleHorizontal }, { id: 'SLIDE_DECK', label: 'Tạo Bộ Slide', icon: Presentation }, { id: 'MC_STUDIO', label: 'MC Studio (Veo 3)', icon: Mic2 }, { id: 'REMAKE_SLIDE', label: 'Làm Mới Slide', icon: Repeat } ].map((m) => {
                    const Icon = m.icon;
                    return (
                        <button key={m.id} onClick={() => setMode(m.id as GenerationMode)} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === m.id ? 'bg-white text-cyan-700 shadow-md ring-1 ring-cyan-100' : 'text-slate-500 hover:text-cyan-600 hover:bg-white/40'}`}>
                            <Icon className="w-4 h-4" /> {m.label}
                        </button>
                    )
                  })}
                </div>

                {/* MC STUDIO CONFIGURATION PANEL (NEW) */}
                {mode === 'MC_STUDIO' && (
                  <div className="w-full max-w-2xl mx-auto mb-6 bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-white/60 shadow-md animate-fade-in-up">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Age Selector */}
                          <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                                  <Users className="w-3 h-3" /> Độ tuổi MC
                              </label>
                              <div className="relative">
                                <select 
                                    value={mcAge} 
                                    onChange={(e) => setMcAge(e.target.value as MCAgeGroup)}
                                    className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-200 appearance-none cursor-pointer"
                                >
                                    {MC_AGES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                              </div>
                          </div>

                          {/* Genre Selector */}
                          <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                                  <Clapperboard className="w-3 h-3" /> Thể loại
                              </label>
                              <div className="relative">
                                <select 
                                    value={mcGenre} 
                                    onChange={(e) => setMcGenre(e.target.value as MCGenre)}
                                    className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-200 appearance-none cursor-pointer"
                                >
                                    {MC_GENRES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                              </div>
                          </div>

                          {/* Nationality Selector */}
                          <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                                  <Globe className="w-3 h-3" /> Quốc tịch / Phong cách
                              </label>
                              <div className="relative">
                                <select 
                                    value={mcNationality} 
                                    onChange={(e) => setMcNationality(e.target.value as MCNationality)}
                                    className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-200 appearance-none cursor-pointer"
                                >
                                    {MC_NATIONALITIES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                              </div>
                          </div>
                      </div>
                      
                      <div className="mt-4 pt-3 border-t border-slate-200/50 flex items-center justify-between">
                          <span className="text-xs text-slate-500 italic">Chọn cấu hình nhân vật trước khi nhập chủ đề.</span>
                          <span className="text-[10px] font-bold bg-cyan-50 text-cyan-600 px-2 py-1 rounded-lg border border-cyan-100">AI Powered Config</span>
                      </div>
                  </div>
                )}

                {mode === 'SLIDE_DECK' && (
                    <div className="flex flex-col items-center gap-4 mb-6 w-full animate-fade-in-up">
                         <div className="flex bg-white/50 p-1 rounded-xl border border-white/60">
                             <button onClick={() => setIsTimeBasedSlide(false)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${!isTimeBasedSlide ? 'bg-white shadow-sm text-cyan-700' : 'text-slate-500 hover:text-cyan-600'}`}>Theo Chủ Đề/Nội Dung</button>
                             <button onClick={() => setIsTimeBasedSlide(true)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isTimeBasedSlide ? 'bg-white shadow-sm text-cyan-700' : 'text-slate-500 hover:text-cyan-600'}`}><Clock className="w-3.5 h-3.5" /> Theo Kịch Bản</button>
                         </div>
                         {!isTimeBasedSlide ? (
                             <div className="flex flex-wrap gap-4 items-center justify-center bg-white/40 px-6 py-3 rounded-2xl border border-white/60 w-full max-w-2xl">
                                <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                                    <ListOrdered className="w-4 h-4 text-orange-500" />
                                    <span className="text-xs font-bold text-slate-500 uppercase">Số lượng Slide:</span>
                                    <input type="number" min="1" max="99" value={slideCount} onChange={(e) => setSlideCount(Math.max(1, Math.min(99, parseInt(e.target.value) || 5)))} className="w-12 bg-transparent font-bold text-slate-800 text-center outline-none border-b border-transparent focus:border-cyan-500" />
                                </div>
                                <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200">
                                    <button onClick={() => setContentMode('CREATIVE')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${contentMode === 'CREATIVE' ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}><Wand className="w-3 h-3" /> Sáng tạo</button>
                                    <button onClick={() => setContentMode('EXACT')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${contentMode === 'EXACT' ? 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}><FileText className="w-3 h-3" /> Sao chép y nguyên</button>
                                </div>
                             </div>
                         ) : (
                             // NEW: Options for Time-Based Mode (Auto vs Fixed)
                             <div className="flex flex-wrap gap-4 items-center justify-center bg-white/40 px-6 py-3 rounded-2xl border border-white/60 w-full max-w-2xl animate-fade-in">
                                 <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200">
                                     <button onClick={() => setTimeBasedMode('AUTO_32S')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${timeBasedMode === 'AUTO_32S' ? 'bg-cyan-100 text-cyan-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>Tự động (32s/slide)</button>
                                     <button onClick={() => setTimeBasedMode('FIXED_COUNT')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${timeBasedMode === 'FIXED_COUNT' ? 'bg-orange-100 text-orange-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>Số lượng cố định</button>
                                 </div>
                                 
                                 {timeBasedMode === 'FIXED_COUNT' && (
                                     <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-xl border border-slate-200 animate-fade-in">
                                         <ListOrdered className="w-4 h-4 text-orange-500" />
                                         <span className="text-xs font-bold text-slate-500 uppercase">Số slide mong muốn:</span>
                                         <input type="number" min="1" max="99" value={slideCount} onChange={(e) => setSlideCount(Math.max(1, Math.min(99, parseInt(e.target.value) || 5)))} className="w-12 bg-transparent font-bold text-slate-800 text-center outline-none border-b border-transparent focus:border-cyan-500" />
                                     </div>
                                 )}
                             </div>
                         )}
                    </div>
                )}
              </div>

              <div className="w-full max-w-3xl mx-auto transition-all">
                {mode === 'REMAKE_SLIDE' ? (
                    <div className="w-full bg-white/60 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-white/60 text-center relative overflow-hidden group hover:border-cyan-200 transition-colors">
                         <div className="absolute inset-0 bg-cyan-50/30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                         <input type="file" multiple accept="image/png, image/jpeg, application/pdf" onChange={handleFileUpload} id="slide-upload" className="hidden" />
                         <label htmlFor="slide-upload" className="cursor-pointer flex flex-col items-center gap-4 relative z-10 py-4">
                             <div className="w-20 h-20 bg-cyan-50 text-cyan-600 rounded-full flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
                                 {status === AppStatus.GENERATING_PROMPT ? <div className="w-8 h-8 border-4 border-cyan-200 border-t-cyan-600 rounded-full animate-spin"></div> : <Upload className="w-8 h-8" />}
                             </div>
                             <div><p className="text-xl font-bold text-slate-700">Tải lên Slide cũ (Ảnh hoặc PDF)</p><p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">Hỗ trợ file PDF nhiều trang hoặc nhiều ảnh rời. AI sẽ tự động phân tích và vẽ lại theo phong cách sinh thái.</p></div>
                         </label>
                    </div>
                ) : (mode === 'SLIDE_DECK' && isTimeBasedSlide) ? (
                     <div className="w-full bg-white/60 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-white/60 flex flex-col gap-4">
                         <div className="flex items-center justify-between">
                             <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><FileText className="w-4 h-4 text-cyan-600" /> Nội dung Kịch bản / Hội thoại</label>
                             {timeBasedMode === 'AUTO_32S' && (
                                 <div className="flex items-center gap-2 bg-white/50 px-3 py-1.5 rounded-lg border border-slate-200">
                                     <Clock className="w-4 h-4 text-orange-500" />
                                     <span className="text-xs font-bold text-slate-500 uppercase">Tổng thời lượng (phút):</span>
                                     <input type="number" min="1" max="120" value={durationMinutes} onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 1)} className="w-16 bg-transparent font-bold text-slate-800 text-center outline-none border-b border-slate-300 focus:border-cyan-500" />
                                 </div>
                             )}
                         </div>
                         <textarea value={scriptContent} onChange={(e) => setScriptContent(e.target.value)} className="w-full h-40 p-4 rounded-xl bg-white/50 border border-slate-200 focus:ring-2 focus:ring-cyan-200 focus:border-cyan-400 outline-none resize-none text-sm text-slate-700" placeholder="Dán toàn bộ nội dung kịch bản hoặc lời thoại vào đây..." />
                         <div className="flex justify-between items-center pt-2">
                             <p className="text-xs text-slate-500 italic">
                                 {timeBasedMode === 'AUTO_32S' 
                                    ? `Dự kiến: ${Math.ceil((durationMinutes * 60) / 32)} Slide` 
                                    : `Sẽ tạo chính xác: ${slideCount} Slide`
                                 }
                             </p>
                             <button onClick={handleCreatePrompt} disabled={!scriptContent.trim() || status === AppStatus.GENERATING_PROMPT} className="px-8 py-3 rounded-xl flex items-center justify-center transition-all disabled:opacity-50 text-white shadow-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 font-bold gap-2">{status === AppStatus.GENERATING_PROMPT ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Bắt đầu Phân Tách <ArrowRight className="w-5 h-5" /></>}</button>
                         </div>
                     </div>
                ) : (
                    <div className="w-full bg-white/60 backdrop-blur-xl p-2 rounded-3xl shadow-2xl shadow-cyan-900/5 border border-white/60 flex items-center gap-2 transition-all focus-within:ring-4 focus-within:ring-cyan-200/50">
                      {mode === 'SLIDE_DECK' ? (
                          <textarea value={topic} onChange={(e) => setTopic(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCreatePrompt(); } }} placeholder={contentMode === 'EXACT' ? "Dán toàn bộ nội dung văn bản muốn chia slide vào đây..." : "Nhập chủ đề bài giảng (VD: Tác hại của rác thải nhựa)..."} className="flex-grow p-4 pl-6 text-sm md:text-base bg-transparent border-none focus:ring-0 text-slate-700 placeholder:text-slate-400/80 resize-none h-20 md:h-14 overflow-hidden" disabled={status === AppStatus.GENERATING_PROMPT} />
                      ) : (
                          <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreatePrompt()} placeholder={mode === 'SINGLE' ? "Nhập chủ đề ảnh..." : mode === 'THUMBNAIL' ? "Nhập nội dung Thumbnail (VD: 5 Mẹo Sống Khỏe)..." : mode === 'MC_STUDIO' ? "Nhập chủ đề Podcast/Video..." : "Nhập chủ đề..."} className="flex-grow p-4 pl-6 text-lg bg-transparent border-none focus:ring-0 text-slate-700 placeholder:text-slate-400/80" disabled={status === AppStatus.GENERATING_PROMPT} />
                      )}
                      <button onClick={handleCreatePrompt} disabled={!topic.trim() || status === AppStatus.GENERATING_PROMPT} className="h-14 w-14 rounded-2xl flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-blue-400/30 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shrink-0">{status === AppStatus.GENERATING_PROMPT ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ArrowRight className="w-6 h-6" />}</button>
                    </div>
                )}
              </div>

              {error && (
                <div className="mt-6 p-4 bg-red-50/80 backdrop-blur-sm text-red-600 rounded-xl border border-red-100 text-center text-sm flex flex-col items-center justify-center gap-3 font-bold shadow-sm animate-fade-in-up">
                  <div className="flex items-center gap-2"><X className="w-4 h-4" /> {error}</div>
                  {(error.includes("Daily Quota") || error.includes("hạn mức") || error.includes("Permission Denied")) && <button onClick={handleChangeApiKey} className="px-4 py-2 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-xs font-bold shadow-sm flex items-center gap-2"><Shield className="w-3 h-3" /> Đổi API Key Ngay</button>}
                </div>
              )}
             </div>
          )}

          {/* MC Studio Rendering - RESTORED AND ENSURED ACTIVE */}
          {mode === 'MC_STUDIO' && status === AppStatus.PROMPT_READY && (
              <div className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in-up pb-10">
                  {['intro', 'outro'].map((key) => {
                      const sceneKey = key as 'intro' | 'outro';
                      const scene = mcScenes[sceneKey];
                      return (
                          <div key={key} className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl border border-white/60 overflow-hidden flex flex-col">
                               <div className="p-4 border-b border-white/50 bg-white/30 flex justify-between items-center"><h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Users className="w-5 h-5 text-cyan-600" /> {scene.title}</h3><span className={`text-[10px] font-bold px-2 py-1 rounded-full ${scene.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{scene.status}</span></div>
                               <div className="p-5 border-b border-white/50 bg-slate-50/50"><label className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1"><FileText className="w-3 h-3" /> Kịch bản lời nói (Lip-sync Script)</label><div className="p-3 bg-white rounded-xl border border-slate-200 text-sm text-slate-700 italic leading-relaxed">"{scene.script}"</div></div>
                               <div className="p-5 flex-grow space-y-4">
                                   <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1"><Edit3 className="w-3 h-3" /> Prompt tạo ảnh (Visual)</label><textarea value={scene.visualPrompt} onChange={(e) => handleUpdateMCScript(scene.type, e.target.value)} className="w-full h-24 p-3 rounded-xl border border-slate-200 bg-white/50 text-xs font-mono text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-200 resize-none" /></div>
                               </div>
                               {scene.imageUrl && (
                                   <div className="w-full aspect-video bg-black relative"><img src={scene.imageUrl} className="w-full h-full object-contain" alt="MC Generated" /><button onClick={() => { const a = document.createElement('a'); a.href = scene.imageUrl!; a.download = `MC_${sceneKey}_${Date.now()}.png`; a.click(); }} className="absolute top-2 right-2 p-2 bg-white/80 rounded-lg hover:bg-white text-slate-700 shadow-lg" title="Tải ảnh"><Download className="w-4 h-4" /></button></div>
                               )}
                               <div className="p-5 pt-2">
                                   <button onClick={() => handleOpenRegenerate(scene.type)} disabled={scene.status === 'GENERATING'} className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-lg hover:shadow-cyan-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2">{scene.status === 'GENERATING' ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><ImageIcon className="w-5 h-5" /> {scene.imageUrl ? 'Tạo Lại Ảnh (Sửa Lỗi)' : `Tạo Ảnh MC (~${currentUnitPrice}đ)`}</>}</button>
                               </div>
                          </div>
                      );
                  })}
              </div>
          )}
          
          {/* SLIDE GRID EDITOR - GATEKEEPER BEFORE BATCH */}
          {(status === AppStatus.PROMPT_READY || batchStatus === 'REVIEW') && (mode === 'SLIDE_DECK' || mode === 'REMAKE_SLIDE') && slides.length > 0 && batchStatus !== 'PROCESSING' && batchStatus !== 'COMPLETED' && (
              <SlideEditorGrid 
                slides={slides} 
                onUpdateSlide={handleGridSlideUpdate} 
                onConfirmBatch={handleRunBatch}
                onExportPrompts={() => exportSafeSequencedPrompts(slides, topic, 'SLIDE')}
                unitPrice={currentUnitPrice}
                isOptimizing={isOptimizing} // Pass optimization state
                onOptimize={handleOptimizeAllPrompts} // Pass optimization handler
              />
          )}

          {/* MAIN BATCH / SINGLE INTERFACE (Legacy View for Single/Thumbnail or Processing Batch) */}
          {(status === AppStatus.PROMPT_READY || status === AppStatus.GENERATING_IMAGE || status === AppStatus.COMPLETED || (status === AppStatus.ERROR && (generatedPrompt || slides.length > 0))) && mode !== 'MC_STUDIO' && !(batchStatus === 'REVIEW' && (mode === 'SLIDE_DECK' || mode === 'REMAKE_SLIDE')) && (
            <div className="w-full h-full flex flex-col gap-6 animate-fade-in pb-10">
              <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 min-h-[600px]">
                
                {/* LEFT PANEL */}
                <div className="lg:col-span-4 h-full flex flex-col order-2 lg:order-1 gap-4">
                  <PromptDisplay 
                      mode={mode} 
                      prompt={currentDisplayPrompt} 
                      onPromptChange={handlePromptChange} 
                      onGenerateImage={status === AppStatus.GENERATING_IMAGE ? handleStopGeneration : () => handleGenerateImage('')} 
                      isGeneratingImage={status === AppStatus.GENERATING_IMAGE} 
                      selectedRatio={aspectRatio} 
                      onRatioChange={setAspectRatio} 
                      includeLogo={includeLogo} 
                      onIncludeLogoChange={setIncludeLogo} 
                      customLogo={customLogo} 
                      onLogoUpload={handleLogoUpload} 
                      onRemoveLogo={handleRemoveCustomLogo} 
                      titleColor={titleColor} 
                      onTitleColorChange={setTitleColor} 
                      bodyColor={bodyColor} 
                      onBodyColorChange={setBodyColor} 
                      referenceImage={referenceImage} 
                      onReferenceImageUpload={handleReferenceImageUpload} 
                      onRemoveReferenceImage={handleRemoveReferenceImage} 
                      thumbnailAvatar={thumbnailAvatar} 
                      onAvatarUpload={handleThumbnailAvatarUpload} 
                      onRemoveAvatar={handleRemoveThumbnailAvatar} 
                      avatarName={avatarName} 
                      onAvatarNameChange={setAvatarName} 
                      subtitle={subtitle}
                      onSubtitleChange={setSubtitle}
                      estimatedCost={currentUnitPrice}
                  />
                  {(mode === 'SLIDE_DECK' || mode === 'REMAKE_SLIDE') && slides.length > 0 && (
                    <div className="flex-grow bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl p-4 border border-white/60 overflow-y-auto max-h-[500px] flex flex-col relative">
                      {/* BATCH CONTROL HEADER */}
                      <div className="bg-white/80 p-3 rounded-xl mb-3 border border-slate-200 shadow-sm sticky top-0 z-20">
                             <div className="flex flex-col gap-2">
                                 <div className="flex justify-between items-center">
                                      <span className="text-xs font-bold text-slate-600 flex items-center gap-2">
                                          {batchStatus === 'PROCESSING' ? <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/> : <div className="w-2 h-2 bg-slate-300 rounded-full"/>}
                                          {batchStatus === 'PROCESSING' ? 'Đang xử lý...' : batchStatus === 'PAUSED' ? 'Tạm dừng' : 'Hoàn tất'}
                                      </span>
                                      {batchStatus === 'PROCESSING' && <button onClick={handlePauseBatch} className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1"><Pause className="w-3 h-3" /> Dừng</button>}
                                 </div>
                                 {/* Progress Bar */}
                                 <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                     <div className="h-full bg-green-500 transition-all duration-500 ease-out" style={{ width: `${(slides.filter(s => s.imageUrl).length / slides.length) * 100}%` }}></div>
                                 </div>
                             </div>
                      </div>

                      <div className="space-y-2">
                        {slides.map((slide) => (
                          <div key={slide.id} className="flex gap-2 items-center">
                            <button onClick={() => setSelectedSlideId(slide.id)} className={`flex-grow w-full text-left p-3 rounded-xl border text-sm transition-all flex items-start gap-3 relative overflow-hidden group ${selectedSlideId === slide.id ? 'bg-cyan-50 border-cyan-200 shadow-sm' : 'bg-white/50 border-transparent hover:bg-white'}`}>
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${slide.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : slide.status === 'GENERATING' ? 'bg-yellow-100 text-yellow-700 animate-pulse' : slide.status === 'ERROR' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>{slide.id}</div>
                              <div className="min-w-0">
                                <div className="font-bold text-slate-700 truncate text-xs">{slide.title}</div>
                                <div className="text-[10px] text-slate-500 truncate">{slide.content}</div>
                              </div>
                              {slide.imageUrl && <div className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg overflow-hidden border border-slate-200"><img src={slide.imageUrl} alt="mini" className="w-full h-full object-cover" /></div>}
                            </button>
                            {slide.status === 'ERROR' && <button onClick={() => handleRegenerateSlide(slide.id)} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200" title="Thử lại"><RefreshCw className="w-4 h-4" /></button>}
                            {slide.status === 'COMPLETED' && <button onClick={() => handleOpenRegenerate(slide.id)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100" title="Tạo lại (Sửa lỗi)"><Sparkles className="w-4 h-4" /></button>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* RIGHT PANEL - IMAGE PREVIEW */}
                <div className="lg:col-span-8 h-full flex flex-col order-1 lg:order-2">
                  <div className="flex-grow bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl shadow-blue-900/5 border border-white/60 overflow-hidden relative group min-h-[400px] flex items-center justify-center">
                    {status === AppStatus.GENERATING_IMAGE && (
                      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm">
                        <div className="relative">
                           <div className="w-20 h-20 border-4 border-cyan-200 border-t-cyan-500 rounded-full animate-spin"></div>
                           <div className="absolute inset-0 flex items-center justify-center"><Sparkles className="w-8 h-8 text-cyan-500 animate-pulse" /></div>
                        </div>
                        <p className="mt-4 font-bold text-cyan-700 animate-pulse">Đang kiến tạo...</p>
                        <p className="text-xs text-slate-500 font-medium mt-2">Dùng mô hình NanoBanana 3.0 Pro</p>
                      </div>
                    )}
                    
                    {currentDisplayImage ? (
                      <div className="relative w-full h-full flex items-center justify-center bg-slate-100">
                        <img src={currentDisplayImage} alt="Generated Infographic" className="max-w-full max-h-full object-contain shadow-lg" />
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                           <button onClick={handleCopyToClipboard} className="p-3 bg-white/90 hover:bg-white text-slate-700 rounded-xl shadow-lg backdrop-blur-sm transition-all transform hover:scale-105" title="Sao chép">
                              {isCopied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                           </button>
                           <div className="relative">
                              <button onClick={() => setShowDownloadMenu(!showDownloadMenu)} className="p-3 bg-white/90 hover:bg-white text-slate-700 rounded-xl shadow-lg backdrop-blur-sm transition-all transform hover:scale-105" title="Tải xuống">
                                <Download className="w-5 h-5" />
                              </button>
                              {showDownloadMenu && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-30 animate-fade-in-up">
                                  <div className="p-1">
                                    <button onClick={() => handleDownload('png')} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm font-medium text-slate-700 rounded-lg">Tải ảnh PNG</button>
                                    <button onClick={() => handleDownload('jpg')} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm font-medium text-slate-700 rounded-lg">Tải ảnh JPG (Nhẹ)</button>
                                    {(mode === 'SLIDE_DECK' || mode === 'REMAKE_SLIDE') && (
                                      <>
                                        <div className="h-px bg-slate-100 my-1"></div>
                                        <button onClick={() => handleDownload('pdf')} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm font-medium text-slate-700 rounded-lg flex items-center gap-2"><FileText className="w-4 h-4 text-red-500"/> Xuất PDF</button>
                                        <button onClick={() => handleDownload('pptx')} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm font-medium text-slate-700 rounded-lg flex items-center gap-2"><Presentation className="w-4 h-4 text-orange-500"/> Xuất PowerPoint</button>
                                        <button onClick={() => handleDownload('zip-png')} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm font-medium text-slate-700 rounded-lg flex items-center gap-2"><FolderArchive className="w-4 h-4 text-blue-500"/> ZIP (PNG HQ)</button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              )}
                           </div>
                        </div>
                        
                        {/* REGENERATE OVERLAY BUTTON (SINGLE MODE) */}
                        {mode === 'SINGLE' && (
                             <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                 <button onClick={() => handleOpenRegenerate('SINGLE')} className="px-6 py-3 bg-white/90 hover:bg-white text-slate-800 rounded-full shadow-lg backdrop-blur-sm font-bold text-sm flex items-center gap-2 transform hover:-translate-y-1 transition-all border border-slate-200">
                                     <Sparkles className="w-4 h-4 text-purple-500" /> Sửa lỗi / Tạo lại
                                 </button>
                             </div>
                        )}
                        {mode === 'REMAKE_SLIDE' && currentOriginalImage && (
                             <div className="absolute top-4 left-4 w-32 h-auto border-2 border-white shadow-lg rounded-lg overflow-hidden transition-all hover:scale-150 origin-top-left z-10">
                                 <div className="bg-black/50 text-white text-[10px] font-bold px-1 absolute top-0 left-0">Gốc</div>
                                 <img src={currentOriginalImage} alt="Original" className="w-full h-full object-cover" />
                             </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
                          <ImageIcon className="w-10 h-10 text-slate-300" />
                        </div>
                        <p className="text-lg font-medium text-slate-500">Chưa có hình ảnh</p>
                        <p className="text-sm max-w-xs mt-2">Nhập nội dung và nhấn "Tạo Ảnh" để bắt đầu quy trình sáng tạo.</p>
                      </div>
                    )}
                  </div>

                  {/* EDIT MODAL FOR SLIDE CONTENT */}
                  {showEditModal && selectedSlideId && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
                          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-fade-in-up">
                              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Edit3 className="w-5 h-5 text-blue-500" /> Chỉnh sửa nội dung</h3>
                              <div className="space-y-4">
                                  <div>
                                      <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Tiêu đề</label>
                                      <input 
                                          type="text" 
                                          value={slides.find(s => s.id === selectedSlideId)?.title || ''} 
                                          onChange={(e) => handleContentUpdate(e.target.value, slides.find(s => s.id === selectedSlideId)?.content || '')}
                                          className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                      />
                                  </div>
                                  <div>
                                      <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Nội dung</label>
                                      <textarea 
                                          value={slides.find(s => s.id === selectedSlideId)?.content || ''} 
                                          onChange={(e) => handleContentUpdate(slides.find(s => s.id === selectedSlideId)?.title || '', e.target.value)}
                                          className="w-full h-32 p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
                                      />
                                  </div>
                              </div>
                              <div className="mt-6 flex justify-end gap-3">
                                  <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-slate-500 hover:text-slate-700 font-bold">Hủy</button>
                                  <button onClick={() => handleContentUpdate(slides.find(s => s.id === selectedSlideId)?.title || '', slides.find(s => s.id === selectedSlideId)?.content || '')} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30">Lưu thay đổi</button>
                              </div>
                          </div>
                      </div>
                  )}

                  {/* REGENERATE MODAL */}
                  {regenModal.isOpen && (
                      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
                          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 animate-fade-in-up border border-white/40">
                              <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                                  <RefreshCw className="w-5 h-5 text-purple-500" /> Tinh chỉnh / Tạo lại
                              </h3>
                              <p className="text-sm text-slate-500 mb-4">
                                  Bạn muốn AI sửa đổi gì ở lần tạo lại này? (Để trống nếu chỉ muốn thử lại ngẫu nhiên)
                              </p>
                              <textarea 
                                  autoFocus
                                  value={regenModal.currentFeedback}
                                  onChange={(e) => setRegenModal({ ...regenModal, currentFeedback: e.target.value })}
                                  placeholder="VD: Làm ảnh sáng hơn, thêm cây xanh, đổi màu nền sang xanh dương..."
                                  className="w-full h-24 p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 text-sm mb-4 resize-none"
                              />
                              <div className="flex gap-3 justify-end">
                                  <button onClick={() => setRegenModal({ ...regenModal, isOpen: false })} className="px-4 py-2 text-slate-500 hover:text-slate-700 font-bold text-sm">Hủy</button>
                                  <button onClick={handleConfirmRegenerate} className="px-5 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-purple-500/30">
                                      Xác nhận & Tạo lại
                                  </button>
                              </div>
                          </div>
                      </div>
                  )}

                  {/* KEY SELECTOR MODAL */}
                  {(showKeySelector || (!keyReady && !sessionStorage.getItem('GEMINI_API_KEY'))) && (
                    <ApiKeySelector onKeySelected={handleKeySelected} onCancel={keyReady ? () => setShowKeySelector(false) : undefined} />
                  )}

                  {/* CONSOLE MODAL */}
                  <UnifiedCommandConsole 
                      isOpen={consoleState.isOpen}
                      onClose={() => setConsoleState({ ...consoleState, isOpen: false })}
                      onConfirm={handleConsoleConfirm}
                      initialData={consoleState.data}
                  />

                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;