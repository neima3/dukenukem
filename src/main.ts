import Phaser from 'phaser';

class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#05060a');

    // starfield
    for (let i = 0; i < 120; i++) {
      const s = this.add.rectangle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        Phaser.Math.Between(1, 3),
        Phaser.Math.Between(1, 3),
        0xffffff,
        Phaser.Math.FloatBetween(0.3, 1),
      );
      void s;
    }

    this.add.text(width / 2, height / 2 - 30, 'REX BRUTUS', {
      fontFamily: 'monospace',
      fontSize: '64px',
      color: '#ff2d6a',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 30, 'ALIEN APOCALYPSE', {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#ffcc33',
    }).setOrigin(0.5);

    this.add.text(width / 2, height - 60, 'scaffold online', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#7a7a99',
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 80, 'click to deploy pipeline...', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#444466',
    }).setOrigin(0.5);
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#05060a',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: 1280,
    height: 720,
  },
  scene: [BootScene],
});

// remove the static boot text once Phaser mounts
const boot = document.getElementById('boot');
if (boot) boot.remove();
