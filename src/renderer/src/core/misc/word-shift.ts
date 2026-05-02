/**
 * The File is rewritten to Typescript by stray-vivify.
 * From https://github.com/IvarK/AntimatterDimensionsSourceCode under MIT License
 * */

/**
 * 根据输入值生成可预测的伪随机数
 * Generates a predictable pseudo-random number based on input value
 * @param x - 输入种子值 / Input seed value
 * @returns 0-1 之间的随机数 / Random number between 0-1
 */
function predictableRandom(x: number): number {
  let start = Math.pow(x % 97, 4.3) * 232344573;
  const a = 15485863;
  const b = 521791;
  start = (start * a) % b;
  // 通过循环增加随机性的复杂度 / Increase randomness complexity through iteration
  for (let i = 0; i < (x * x) % 90 + 90; i++) {
    start = (start * a) % b;
  }
  return start / b;
}

/**
 * 生成随机特殊符号（ASCII 192-242）
 * Generate a random special symbol (ASCII 192-242)
 * @returns 扩展拉丁字符 / Extended Latin character
 */
function randomSymbol(): string {
  return String.fromCharCode(Math.floor(Math.random() * 50) + 192);
}

/**
 * 文字效果工具类
 * Word effect utilities for creating dynamic text animations
 */
export default {
  /**
   * 文字循环效果 - 从列表中循环显示不同的单词/字符串
   * Word cycling uses two different effects to smoothly ease between words in the randomized set
   *
   * 实现两种平滑过渡效果：
   * Implements two smooth transition effects:
   * 1. 随机化效果平滑地淡入淡出，约 62% 的中间时间完全不被随机化
   *    The randomization effect eases in and out smoothly, with about 62% in the time in the middle being
   *    completely unrandomized (randomCrossWords is passed frac <= 0). The randomization parameter goes well above 1
   *    in order to have a good chance of properly randomizing the entire input in the middle
   * 2. 在每个单词的随机化时间的"边缘"（每侧 12%），与前后单词混合。主要用于平滑处理不同长度字符串的切换
   *    Near the "edges" (12% on each side) of each word's randomization time, it's blended with the previous or next
   *    word. This mostly serves to smoothly ease between strings of different lengths, and only occurs between
   *    strings which already have a high randomization fraction (frac > 1.3)
   *
   * @param list - 要循环显示的字符串列表 / List of strings to cycle through
   * @param noBuffer - 是否禁用缓冲填充 / Whether to disable buffer padding
   * @returns 处理后的字符串 / Processed string
   */
  wordCycle(list: string[], noBuffer: boolean = false): string {
    const len = list.length;
    // 计算当前时间片（每 250ms 为一个单位）
    // Calculate current tick (250ms per unit)
    const tick = Math.floor(Date.now() / 250) % (len * 5);
    // 获取在当前单词周期内的进度（0-5 之间）
    // Get progress within current word cycle (between 0-5)
    const mod5 = ((Date.now() / 250) % (len * 5)) % 5;
    // 确定应该显示第几个单词
    // Determine which word to display
    const largeTick = Math.floor(tick / 5);
    let v = list[largeTick];

    // 与相邻单词混合，mod5 为 0 或 5 时对应 0.5 的混合参数
    // Blend with adjacent words, in such a way that mod5 being 0 or 5 corresponds with a 0.5 blend parameter
    if (mod5 < 0.6) {
      // 前 12% 时间：与前一个单词混合
      // First 12%: blend with previous word
      v = this.blendWords(
        list[(largeTick + list.length - 1) % list.length],
        list[largeTick],
        (mod5 + 0.6) / 1.2
      );
    } else if (mod5 > 4.4) {
      // 后 12% 时间：与下一个单词混合
      // Last 12%: blend with next word
      v = this.blendWords(
        list[largeTick],
        list[(largeTick + 1) % list.length],
        (mod5 - 4.4) / 1.2
      );
    }

    // 应用随机化效果，使用四次方曲线控制强度
    // Apply randomization effect using quartic curve to control intensity
    v = this.randomCrossWords(v, 0.1 * Math.pow(mod5 - 2.5, 4) - 0.6);
    if (noBuffer) return v;

    // 计算最大单词长度用于缓冲填充
    // Calculate max word length for buffer padding
    const maxWordLen = Math.max(...list.map(x => x.length));
    const bufferSpace = (maxWordLen - v.length) / 2;

    // 使用 ALT+255（不间断空格）在两侧填充，防止 UI 抖动
    // Buffer the result with ALT+255 on either side to prevent the ui from twitching.
    // Spaces do not work due to being automatically collapsed, and css fixing this causes other issues.
    return "\u00A0".repeat(Math.ceil(bufferSpace)) + v + "\u00A0".repeat(Math.floor(bufferSpace));
  },

  /**
   * 随机交叉文字 - 将字符串中的部分字符替换为随机符号
   * Randomly replace characters in string with random symbols
   *
   * 注意：frac 参数表示期望的随机化比例，但由于字符串长度和随机输出的影响，
   * 实际随机化的字符数量可能略少
   * Note that while frac may appear to specify the proportion of letters randomized, it may end up being slightly less
   * depending on the specific string length and random output sometimes giving outputs which aren't coprime
   *
   * @param str - 输入字符串 / Input string
   * @param frac - 随机化程度（0=不随机，越大越随机）/ Randomization level (0=no random, higher=more random)
   * @returns 随机化处理后的字符串 / Randomized string
   */
  randomCrossWords(str: string, frac: number = 0.7): string {
    if (frac <= 0) return str;
    const x = str.split("");
    // 根据 frac 决定要替换的字符数量
    // Determine number of characters to replace based on frac
    for (let i = 0; i < x.length * frac; i++) {
      // 使用可预测的随机数确保相同时间点产生相同的随机位置
      // Use predictable random to ensure same random positions at same time point
      const randomIndex = Math.floor(
        predictableRandom(Math.floor(Date.now() / 500) % 964372 + 1.618 * i) * x.length
      );
      x[randomIndex] = randomSymbol();
    }
    return x.join("");
  },

  /**
   * 混合两个字符串 - 产生中间长度的字符串
   * Blend two strings together to produce a string of intermediate length
   *
   * 此方法仅应用于最终会被完全随机化的单词，因为未打乱的外观可能看起来不佳
   * This should only be used on words which will end up being completely randomized, because the unscrambled appearance
   * of the output may look bad. Blends two strings together to produce a string of intermediate length, taking a
   * specified fraction (param, 0 to 1) from the first word and the rest (1 - param) from the second
   *
   * @param first - 第一个字符串 / First string
   * @param second - 第二个字符串 / Second string
   * @param param - 混合比例（0=返回first，1=返回second）/ Blend ratio (0=return first, 1=return second)
   * @returns 混合后的字符串 / Blended string
   */
  blendWords(first: string, second: string, param: number): string {
    if (param <= 0) return first;
    if (param >= 1) return second;
    // 从 first 取前半部分 + 从 second 取后半部分
    // Take first part from 'first' + last part from 'second'
    return first.substring(0, first.length * (1 - param)) +
      second.substring(second.length * (1 - param), second.length);
  }
};
