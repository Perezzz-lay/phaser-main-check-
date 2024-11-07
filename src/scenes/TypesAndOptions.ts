import Phaser, { GameObjects, Scene } from "phaser";

/**
 * Направление (1 при горизонтали и 2 при вертикали )
 */
type Direction = 1 | 2;



interface Gem {
  gemColor: number;
  gemSprite: GameObjects.Sprite;
  isEmpty: boolean;
}

/**
 *Интерфейс для выбранного камня, если он есть, или null
 */
type SelectedGem = Gem | null;


/**
 * Игровые Опции, размеры, цвета и скорости
 *
 */
export const gameOptions = {
  fieldSize: 6,
  gemColors: 5,
  gemSize: 72,
  swapSpeed: 75,
  fallSpeed: 50,
  destroySpeed: 50
};
export let canPick: boolean = true;
export let dragging: boolean = false;
export let selectedGem: SelectedGem = null;
export let gameArray: Gem[][] = []; // Массив с объектами типа Gem
export let poolArray: Gem[] = []; // Пул для переиспользования камней
export let gemGroup!: Phaser.GameObjects.Group;
export let removeMap!: number[][];
export let swappingGems: [Gem, Gem] | null = null;
export let userScore: number = 0;
export let matches: number = 0;
export const HORIZONTAL: Direction = 1;
export const VERTICAL: Direction = 2;
export type {Direction,SelectedGem,Gem}