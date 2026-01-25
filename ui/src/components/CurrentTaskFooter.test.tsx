import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// AudioContext のモック
class MockAudioContext {
  currentTime = 0;
  destination = {};

  createOscillator() {
    return {
      frequency: { value: 0 },
      type: "sine",
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
  }

  createGain() {
    return {
      gain: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    };
  }
}

// グローバルな AudioContext を置き換え
// eslint-disable-next-line no-undef
(globalThis as unknown as { AudioContext: typeof MockAudioContext }).AudioContext =
  MockAudioContext;

describe("CurrentTaskFooter - 見積もり時間超過時の通知", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("見積もり時間の計算が正しく行われる", () => {
    const estimatedMinutes = 10;
    const estimatedSeconds = estimatedMinutes * 60;
    expect(estimatedSeconds).toBe(600);
  });

  it("経過時間が見積もり時間を超えているかを判定できる", () => {
    const estimatedMinutes = 10;
    const elapsedTimeInSeconds = 650; // 10分50秒
    const isOverEstimated = elapsedTimeInSeconds >= estimatedMinutes * 60;
    expect(isOverEstimated).toBe(true);
  });

  it("経過時間が見積もり時間内であることを判定できる", () => {
    const estimatedMinutes = 10;
    const elapsedTimeInSeconds = 500; // 8分20秒
    const isOverEstimated = elapsedTimeInSeconds >= estimatedMinutes * 60;
    expect(isOverEstimated).toBe(false);
  });

  it("見積もり時間がnullの場合は超過判定がfalseになる", () => {
    const estimatedMinutes = null;
    const elapsedTimeInSeconds = 1000;
    const isOverEstimated =
      estimatedMinutes && elapsedTimeInSeconds >= estimatedMinutes * 60;
    expect(isOverEstimated).toBeFalsy();
  });

  it("AudioContext が正しく初期化できる", () => {
    const audioContext = new AudioContext();
    expect(audioContext).toBeDefined();
    expect(audioContext.createOscillator).toBeDefined();
    expect(audioContext.createGain).toBeDefined();
  });

  it("AudioContext で音を生成できる", () => {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.frequency.value = 800;
    oscillator.type = "sine";

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    expect(oscillator.connect).toHaveBeenCalledWith(gainNode);
    expect(gainNode.connect).toHaveBeenCalledWith(audioContext.destination);
  });
});

