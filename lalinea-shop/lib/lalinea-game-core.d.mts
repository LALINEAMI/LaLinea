export const ENGINE_VERSION: string;
export function reward(level: number): number;
export class Game {
  constructor(level?: number, seed?: number);
  mode: string;
  elapsed: number;
  coins: number;
  hearts: number;
  level: { number: number; time: number; required: number; reward: number };
  start(): void;
  step(dt: number, input: { left: boolean; right: boolean; jump: boolean }): void;
}
