import Phaser, { GameObjects, Scene } from 'phaser';
import { Gems } from './Gems';
import { gameOptions } from './TypesAndOptions';


export default class Demo extends Gems {


  preload() {
    this.load.spritesheet('gems', '/assets/items.png', {
      frameWidth: gameOptions.gemSize,
      frameHeight: gameOptions.gemSize,
    });
  }

  create() {
    this.drawField();
    this.input.on('pointerdown', this.gemSelect, this);
    this.input.on('pointermove', this.startSwipe, this);
    this.input.on('pointerup', this.stopSwipe, this);
  }
  // Рисуем игровое поле
  drawField() {
    Demo.gemGroup = this.add.group();
    for (let i = 0; i < gameOptions.fieldSize; i++) {
      Demo.gameArray[i] = [];
      for (let j = 0; j < gameOptions.fieldSize; j++) {
        const gem = this.add.sprite(
          gameOptions.gemSize * j + gameOptions.gemSize / 2,
          gameOptions.gemSize * i + gameOptions.gemSize / 2,
          'gems'
        );
        Demo.gemGroup.add(gem);

        // Устанавливаем случайный цвет до тех пор, пока не будет совпадений
        let randomColor;
        do {
          randomColor = Phaser.Math.Between(0, gameOptions.gemColors - 1);
          gem.setFrame(randomColor);
          Demo.gameArray[i][j] = {
            gemColor: randomColor,
            gemSprite: gem,
            isEmpty: false,
          };
        } while (this.isMatch(i, j));
      }
    }
  }

}
