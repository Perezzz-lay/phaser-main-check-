import type { Direction, SelectedGem, Gem } from "./TypesAndOptions";
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
  matches
} from "./TypesAndOptions";
import { selectedGem } from "./TypesAndOptions";
import { Match } from "./Matches";
import { HORIZONTAL } from "./TypesAndOptions";
import { VERTICAL } from "./TypesAndOptions";

export class Gems extends Match {
  updateRemoveMap(
    i: number,
    startStreak: number,
    colorStreak: number,
    direction: number
  ) {
    for (let k = 0; k < colorStreak; k++) {
      if (direction === HORIZONTAL) {
        Gems.removeMap[i][startStreak + k]++;
      } else {
        Gems.removeMap[startStreak + k][i]++;
      }
    }
  }
  public selectGem(gem: any) {
    gem.gemSprite.setScale(1.2);
    gem.gemSprite.setDepth(1);
    Gems.selectedGem = gem;
  }
  /**
   * Уничтожает гемы
   */
  destroyGems() {
    Gems.matches++;

    // Увеличиваем множитель, если счет совпадений кратен 3
    if (Gems.matches % 3 === 0) {
      Gems.userScore++;
      // store.dispatch(actions.setUserMultiplier(this.userScore)); // Обновление UI
    }

    let destroyed = 0;

    const onGemDestroyed = (i: number, j: number) => {
      destroyed--;
      Gems.gameArray[i][j].gemSprite.visible = false;
      Gems.poolArray.push(Gems.gameArray[i][j].gemSprite);
      Gems.gameArray[i][j].isEmpty = true;

      // Проверяем, если все уничтоженные камни обработаны, чтобы заполнить поле новыми камнями
      if (destroyed === 0) {
        this.makeGemsFall();
        this.replenishField();
      }
    };

    Gems.gameArray.forEach((row, i: number) => {
      row.forEach((tile, j: number) => {
        if (Gems.removeMap[i][j] > 0) {
          destroyed++;

          // Анимация исчезновения
          this.tweens.add({
            targets: tile.gemSprite,
            alpha: 0,
            duration: gameOptions.destroySpeed,
            callbackScope: this,
            onComplete: () => onGemDestroyed(i, j)
          });
        }
      });
    });
  }
  

  /**
   * Позволяет выбрать гем
   * @param pointer 
   */
  gemSelect(pointer: Phaser.Input.Pointer) {
    if (!Gems.canPick) return;

    Gems.dragging = true;
    const row = Math.floor(pointer.y / gameOptions.gemSize);
    const col = Math.floor(pointer.x / gameOptions.gemSize);
    const pickedGem = this.gemAt(row, col);

    if (pickedGem) {
      if (!Gems.selectedGem) {
        this.selectGem(pickedGem);
      } else {
        this.handleSelectedGem(pickedGem);
      }
    }
  }

  /**
   * Убирает выделение гема
   */
  deselectGem() {
    if (Gems.selectedGem) {
      Gems.selectedGem.gemSprite.setScale(1);
      Gems.selectedGem = null;
    }
  }

  areNext(gem1: Gem, gem2: Gem) {
    return (
      Math.abs(this.getGemRow(gem1) - this.getGemRow(gem2)) +
        Math.abs(this.getGemCol(gem1) - this.getGemCol(gem2)) ===
      1
    );
  }

  handleSelectedGem(pickedGem: any) {
    if (this.areTheSame(pickedGem, Gems.selectedGem)) {
      this.deselectGem();
    } else if (this.areNext(pickedGem, Gems.selectedGem)) {
      Gems.selectedGem.gemSprite.setScale(1);
      this.swapGems(Gems.selectedGem, pickedGem, true);
    } else {
      this.deselectGem();
      this.selectGem(pickedGem);
    }
  }

  holesBelow(row: number, col: number) {
    let result = 0;
    for (let i = row + 1; i < gameOptions.fieldSize; i++) {
      if (Gems.gameArray[i][col].isEmpty) {
        result++;
      }
    }
    return result;
  }


  /**
   * Меняет гемы местами
   * @param gem1 number
   * @param gem2 number
   * @param swapBack boolean
   */
  swapGems(gem1: number, gem2: number, swapBack: boolean) {
    // Начинаем процесс обмена камней, блокируем взаимодействие с игровым полем
    Gems.swappingGems = 2;
    Gems.canPick = false;
    Gems.dragging = false;

    // Сохраняем цвета и спрайты для обмена
    const fromColor = gem1.gemColor;
    const fromSprite = gem1.gemSprite;
    const toColor = gem2.gemColor;
    const toSprite = gem2.gemSprite;

    // Получаем позиции каждого камня в массиве
    const gem1Row = this.getGemRow(gem1);
    const gem1Col = this.getGemCol(gem1);
    const gem2Row = this.getGemRow(gem2);
    const gem2Col = this.getGemCol(gem2);

    // Обновляем массив игры с новыми значениями цветов и спрайтов после обмена
    Gems.gameArray[gem1Row][gem1Col].gemColor = toColor;
    Gems.gameArray[gem1Row][gem1Col].gemSprite = toSprite;
    Gems.gameArray[gem2Row][gem2Col].gemColor = fromColor;
    Gems.gameArray[gem2Row][gem2Col].gemSprite = fromSprite;

    // Запускаем анимацию обмена для каждого камня
    this.tweenGem(gem1, gem2, swapBack);
    this.tweenGem(gem2, gem1, swapBack);
  }

  tweenGem(gem1: number, gem2: number, swapBack: boolean) {
    const row = this.getGemRow(gem1);
    const col = this.getGemCol(gem1);

    // Анимация для передвижения камня к новой позиции
    this.tweens.add({
      targets: Gems.gameArray[row][col].gemSprite,
      x: col * gameOptions.gemSize + gameOptions.gemSize / 2,
      y: row * gameOptions.gemSize + gameOptions.gemSize / 2,
      duration: gameOptions.swapSpeed,
      callbackScope: this,
      onComplete: () => {
        Gems.swappingGems--;

        // Проверяем завершение анимации обмена
        if (Gems.swappingGems === 0) {
          if (!this.matchInBoard() && swapBack) {
            // Если нет совпадений, возвращаем камни на исходные позиции
            this.swapGems(gem1, gem2, false);
          } else {
            // Если есть совпадения, обрабатываем их
            this.matchInBoard() ? this.handleMatches() : this.enablePicking();
          }
        }
      }
    });
  }

  /**
   * Позволяет гемам упасть, дабы заполнить поле.
   */
  makeGemsFall() {
    const { fieldSize, gemSize, fallSpeed } = gameOptions;

    for (let j = 0; j < fieldSize; j++) {
      let emptySpace = 0;

      for (let i = fieldSize - 1; i >= 0; i--) {
        const tile = Gems.gameArray[i][j];

        if (tile.isEmpty) {
          emptySpace++;
        } else if (emptySpace > 0) {
          const { gemSprite } = tile;
          const targetY = gemSprite.y + emptySpace * gemSize;

          // Анимация падения
          this.tweens.add({
            targets: gemSprite,
            y: targetY,
            duration: fallSpeed * emptySpace
          });

          // Обновляем игровое поле
          Gems.gameArray[i + emptySpace][j] = {
            gemColor: tile.gemColor, // Сохраняем цвет
            gemSprite: tile.gemSprite, // Сохраняем спрайт
            isEmpty: false
          };
          Gems.gameArray[i][j].isEmpty = true; // Очищаем ячейку
        }
      }
    }
  }

  replenishField() {
    let replenished = 0;
    const { fieldSize, gemSize, fallSpeed, gemColors } = gameOptions;

    const animateGemFall = (gemSprite, targetY, emptySpots) => {
      this.tweens.add({
        targets: gemSprite,
        y: targetY,
        duration: fallSpeed * emptySpots,
        callbackScope: this,
        onComplete: onGemFallComplete
      });
    };

    const setupGem = (i, j, emptySpots) => {
      replenished++;
      const randomColor = Phaser.Math.Between(0, gemColors - 1);

      // Создаем и настраиваем новый камень
      const gemSprite = Gems.poolArray.pop();
      gemSprite.setFrame(randomColor);
      gemSprite.visible = true;
      gemSprite.alpha = 1;
      gemSprite.x = gemSize * j + gemSize / 2;
      gemSprite.y = gemSize / 2 - (emptySpots - i) * gemSize;

      // Обновляем ячейку в gameArray
      Gems.gameArray[i][j] = {
        gemColor: randomColor,
        gemSprite,
        isEmpty: false
      };

      // Анимация падения
      animateGemFall(gemSprite, gemSize * i + gemSize / 2, emptySpots);
    };

    const onGemFallComplete = () => {
      replenished--;
      if (replenished === 0) {
        if (this.matchInBoard()) {
          this.time.addEvent({
            delay: 250,
            callback: this.handleMatches.bind(this) // Привязываем контекст `this`
          });
        } else {
          Gems.canPick = true;
          Gems.selectedGem = null;
        }
      }
    };

    for (let j = 0; j < fieldSize; j++) {
      const emptySpots = this.holesInCol(j);
      Array.from({ length: emptySpots }).forEach((_, i) =>
        setupGem(i, j, emptySpots)
      );
    }
  }

  holesInCol(col: number) {
    var result = 0;
    for (let i = 0; i < gameOptions.fieldSize; i++) {
      if (Gems.gameArray[i][col].isEmpty) {
        result++;
      }
    }
    return result;
  }

  handleMatches() {
    console.log(
      "markMatches function exists:",
      typeof this.markMatches === "function"
    ); // Проверка наличия функции

    Gems.removeMap = Array.from({ length: gameOptions.fieldSize }, () =>
      Array(gameOptions.fieldSize).fill(0)
    );

    if (typeof this.markMatches === "function") {
      this.markMatches(HORIZONTAL);
      this.markMatches(VERTICAL);
    } else {
      console.error("markMatches function is not defined in this context");
    }

    this.destroyGems();
  }


  getSwipeDelta(deltaX: number, deltaY: number) {
    const delta = { row: 0, col: 0 };

    if (
      deltaX > gameOptions.gemSize / 2 &&
      Math.abs(deltaY) < gameOptions.gemSize / 4
    ) {
      delta.col = -1; // Swipe left
    } else if (
      deltaX < -gameOptions.gemSize / 2 &&
      Math.abs(deltaY) < gameOptions.gemSize / 4
    ) {
      delta.col = 1; // Swipe right
    }

    if (
      deltaY > gameOptions.gemSize / 2 &&
      Math.abs(deltaX) < gameOptions.gemSize / 4
    ) {
      delta.row = -1; // Swipe up
    } else if (
      deltaY < -gameOptions.gemSize / 2 &&
      Math.abs(deltaX) < gameOptions.gemSize / 4
    ) {
      delta.row = 1; // Swipe down
    }

    return delta;
  }
  /**
   * Определяем изменения в строке и столбце на основе свайпа
   * @param pointer 
   * @returns 
   */
  startSwipe(pointer: Phaser.Input.Pointer) {
    if (!Gems.dragging || !Gems.selectedGem) return;

    const deltaX = pointer.downX - pointer.x;
    const deltaY = pointer.downY - pointer.y;

    // Определяем изменения в строке и столбце на основе свайпа
    const delta = this.getSwipeDelta(deltaX, deltaY);

    if (delta.row !== 0 || delta.col !== 0) {
      const targetGem = this.gemAt(
        this.getGemRow(Gems.selectedGem) + delta.row,
        this.getGemCol(Demo.selectedGem) + delta.col
      );

      if (targetGem) {
        Demo.selectedGem.gemSprite.setScale(1);
        this.swapGems(Demo.selectedGem, targetGem, true);
      }
    }
  }
}
