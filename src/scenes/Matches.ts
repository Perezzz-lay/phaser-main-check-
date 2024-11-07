import Phaser, { GameObjects, Scene } from "phaser";
import type { Direction, SelectedGem, Gem } from "./TypesAndOptions";
import { HORIZONTAL } from "./TypesAndOptions";
import { VERTICAL } from "./TypesAndOptions";
import {
  gameOptions,
  canPick,
  dragging,
  gameArray,
  poolArray,
  gemGroup,
  removeMap,
  swappingGems,
  userScore,
  matches,
  selectedGem
} from "./TypesAndOptions";

export class Match extends Scene {
  public static selectedGem: SelectedGem | null = selectedGem;
  public static gameArray = gameArray;
  public static canPick = canPick;
  public static dragging = dragging;
  public static poolArray = poolArray;
  public static gemGroup = gemGroup;
  public static swappingGems = swappingGems;
  public static userScore = userScore;
  public static removeMap = removeMap;
  public static matches = matches;
  constructor() {
    super("GameScene");
  }
  /**
   * 
   * @param row Определяет строку
   * @param col Определяет столбец
   * @returns Возвращает значение bool
   */
  isMatch(row: number, col: number) {
    // Подсчет гемов
    let matchCount = 0;
    let matchCounts = 0;
  
    // Горизонтальная проверка
    if (this.isHorizontalMatch(row, col)) {
     matchCount += 3;
    }
  
    // Вертикальная проверка
    if (this.isVerticalMatch(row, col)) {
     matchCount += 3;
    }
    
      // Горизонтальная проверка
      matchCounts += this.countHorizontalMatches(row, col);
  
      // Вертикальная проверка
      matchCounts += this.countVerticalMatches(row, col);
  
      // Выводим количество удаленных гемов
      if (matchCounts > 0) {
        console.log(`Удалено ${matchCount} гемов`);
      }
    console.log(matchCounts)
    return matchCount > 0; // Возвращаем true, если найдено хотя бы одно совпадение
   }

  /**
   * 
  * @param row Определяет строку
   * @param col Определяет столбец
   * @returns Возвращает значение bool
   */
  isHorizontalMatch(row: number, col: number) {
    return (
      this.gemAt(row, col)?.gemColor === this.gemAt(row, col - 1)?.gemColor &&
      this.gemAt(row, col)?.gemColor === this.gemAt(row, col - 2)?.gemColor
    );
  }

  /**
   * 
  * @param row Определяет строку
   * @param col Определяет столбец
   * @returns Возвращает значение bool
   */
  isVerticalMatch(row: number, col: number) {
    console.log()
    return (
      
      this.gemAt(row, col)?.gemColor === this.gemAt(row - 1, col)?.gemColor &&
      this.gemAt(row, col)?.gemColor === this.gemAt(row - 2, col)?.gemColor
    );
  }

  /**
   * 
   * @param row 
   * @param col 
   * @returns 
   */
  gemAt(row: number, col: number): Gem | null {
    if (row < 0 || row >= gameOptions.fieldSize || col < 0 || col >= gameOptions.fieldSize) {
        return null;
    }
    if (Match.gameArray && Match.gameArray[row] && Match.gameArray[row][col]) {
        return Match.gameArray[row][col];
    } else {
        return null;
    }
}
  countHorizontalMatches(row: number, col: number): number {
     let matchCount = 0;
     let currentColor = this.gemAt(row, col)?.gemColor;
     
     // Проверяем вправо
     for (let i = col + 1; i < gameOptions.fieldSize; i++) {
       const gem = this.gemAt(row, i); // Получаем гем
       if (gem && gem.gemColor === currentColor) { // Проверяем, не null ли гем
         matchCount++;
       } else {
         break; // Совпадения нет, выходим из цикла
       }
     }

    // Проверяем влево
    for (let i = col - 1; i >= 0; i--) {
      const gem = this.gemAt(row, i);
      if (gem && gem.gemColor === currentColor) {
        matchCount++;
      } else {
        break; 
      }
    }

    return matchCount >= 2 ? matchCount + 1 : 0;
  }

  /**
   * Подсчитывает количество совпадающих гемов по вертикали
   * @param row строка
   * @param col столбец
   * @returns количество совпадающих гемов
   */
  countVerticalMatches(row: number, col: number): number {
    let matchCount = 0;
    let currentColor = this.gemAt(row, col)?.gemColor;
    
    // Проверяем вниз
    for (let i = row + 1; i < gameOptions.fieldSize; i++) {
      if (this.gemAt(i, col)?.gemColor === currentColor) {
        matchCount++;
      } else {
        break; // Совпадения нет, выходим из цикла
      }
    }

    // Проверяем вверх
    for (let i = row - 1; i >= 0; i--) {
      if (this.gemAt(i, col)?.gemColor === currentColor) {
        matchCount++;
      } else {
        break; // Совпадения нет, выходим из цикла
      }
    }

    // Возвращаем количество совпадений, учитывая начальный гем
    return matchCount >= 2 ? matchCount + 1 : 0;
  }

  /**
   * Проверка на соответсвие гемов
   * @param gem1 
   * @param gem2 
   */
  areTheSame(gem1: Gem, gem2: Gem) {
    return (
      this.getGemRow(gem1) === this.getGemRow(gem2) &&
      this.getGemCol(gem1) === this.getGemCol(gem2)
    );
  }
  /**
   * Получает Элемент в Строке
   * @param gem Гем
   * @returns 
   */
  getGemRow(gem: Gem) {
    return Math.floor(gem.gemSprite.y / gameOptions.gemSize);
  }
  /**
   * Получает элемент в Столбце
   * @param gem 
   * @returns 
   */
  getGemCol(gem: Gem) {
    return Math.floor(gem.gemSprite.x / gameOptions.gemSize);
  }
  stopSwipe() {
    Match.dragging = false;
  }

  matchInBoard() {
    // Проверяем наличие совпадений на игровом поле
    for (let i = 0; i < gameOptions.fieldSize; i++) {
      for (let j = 0; j < gameOptions.fieldSize; j++) {
        if (this.isMatch(i, j)) return true;
      }
    }
    return false;
  }

  markMatches(direction: number) {
    const { fieldSize } = gameOptions;

    for (let i = 0; i < fieldSize; i++) {
      let colorStreak = 1;
      let startStreak = 0;
      let currentColor = -1;

      for (let j = 0; j <= fieldSize; j++) {
        // j <= fieldSize, чтобы обработать конец ряда
        const colorToWatch =
          j < fieldSize
            ? direction === HORIZONTAL
              ? this.gemAt(i, j).gemColor
              : this.gemAt(j, i).gemColor
            : -1; // Искусственное завершение ряда для обработки последней серии

        if (colorToWatch === currentColor) {
          colorStreak++;
        } else {
          if (colorStreak >= 3) {
            this.updateRemoveMap(i, startStreak, colorStreak, direction);
          }
          startStreak = j; // Начинаем новую серию
          colorStreak = 1;
          currentColor = colorToWatch;
        }
      }
    }
  }

  enablePicking() {
    Match.canPick = true;
    Match.selectedGem = null;
  }
}
