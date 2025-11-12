import { MultimodalAIService, multimodalAIService } from "../../../lib/ai/multimodal-ai-service"

describe("MultimodalAIService getters and defaults", () => {
  test("getInstance returns singleton", () => {
    const a = MultimodalAIService.getInstance()
    const b = MultimodalAIService.getInstance()
    expect(a).toBe(b)
  })

  test("getters return non-empty model lists", () => {
    const svc = multimodalAIService
    expect(svc.getTextModels().length).toBeGreaterThan(0)
    expect(svc.getImageModels().length).toBeGreaterThan(0)
    expect(svc.getAudioModels().length).toBeGreaterThan(0)
    expect(svc.getVideoModels().length).toBeGreaterThan(0)
    expect(svc.getMultimodalModels().length).toBeGreaterThan(0)
  })
})

describe("text generation defaults", () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })
  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  test("generateText uses default model and merges default options", async () => {
    const svc = multimodalAIService
    const promise = svc.generateText("你好，世界")
    jest.advanceTimersByTime(1000)
    const res = await promise
    expect(res.model).toBe("gpt-4o")
    expect(res.text).toContain("GPT-4o")
    expect(res.usage.totalTokens).toBeGreaterThan(0)
  })
})

describe("image generation defaults and validation", () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })
  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  test("generateImage applies default size and format", async () => {
    const svc = multimodalAIService
    const p = svc.generateImage("一只可爱的猫")
    jest.advanceTimersByTime(2000)
    const res = await p
    expect(res.model).toBe("dall-e-3")
    expect(res.images[0].format).toBe("png")
    expect(res.images[0].size).toBe("1024x1024")
  })
})

describe("speech and audio defaults", () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })
  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  test("speechToText uses default language zh", async () => {
    const svc = multimodalAIService
    const blob = new Blob(["mock"], { type: "audio/wav" })
    const p = svc.speechToText(blob)
    jest.advanceTimersByTime(2000)
    const res = await p
    expect(res.model).toBe("whisper-large-v3")
    expect(res.language).toBe("zh")
    expect(res.segments.length).toBeGreaterThan(0)
  })

  test("textToSpeech uses default voice and format", async () => {
    const svc = multimodalAIService
    const p = svc.textToSpeech("Hello world")
    jest.advanceTimersByTime(1500)
    const res = await p
    expect(res.model).toBe("tts-1")
    expect(res.voice).toBe("alloy")
    expect(res.format).toBe("mp3")
  })
})

describe("video generation defaults", () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })
  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  test("generateVideo applies default duration/resolution/format", async () => {
    const svc = multimodalAIService
    const p = svc.generateVideo("一个穿红色外套的人在下棋")
    jest.advanceTimersByTime(5000)
    const res = await p
    expect(res.model).toBe("pika-1")
    expect(res.duration).toBe(5)
    expect(res.resolution).toBe("720p")
    expect(res.format).toBe("mp4")
  })
})

describe("image processing validations and defaults", () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })
  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  test("processImage success path with supported format", async () => {
    const svc = multimodalAIService
    const file = new File(["data"], "sample.png", { type: "image/png" })
    const p = svc.processImage(file, "检测图像内容")
    jest.advanceTimersByTime(3000)
    const res = await p
    expect(res.analysis).toContain("sample.png")
    expect(res.confidence).toBeGreaterThan(0)
  })
})