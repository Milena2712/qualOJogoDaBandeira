let bg;
let balas = [];
let bolas = [];
let sangue = [];
let disparou = false;
let fraseExibida = false;
let somTiro, somPingPong;
let sangueCobertura = 0;
let sangueAtivo = false;
let manchasSangue = [];
let tiros3D = [];

function preload() {
  bg = loadImage("1000451999.png");
  somTiro = loadSound("gun-shot-350315.mp3");
  somPingPong = loadSound("ping-pong-sample-23500.mp3");
}

function setup() {
  createCanvas(768, 1086);
  textAlign(CENTER, CENTER);
  textSize(32);
  fill(255);
  
  console.log("Canvas criado:", width, "x", height);
  console.log("Som tiro carregado:", somTiro);
  console.log("Som ping pong carregado:", somPingPong);
}

function draw() {
  background(0);
  image(bg, 0, 0, width, height);

  for (let b of balas) {
    b.update();
    b.show();
  }

  for (let i = tiros3D.length - 1; i >= 0; i--) {
    tiros3D[i].update();
    tiros3D[i].show();
    
    if (tiros3D[i].isFinished()) {
      tiros3D.splice(i, 1);
    }
  }

  for (let i = bolas.length - 1; i >= 0; i--) {
    bolas[i].update();
    bolas[i].show();
    if (bolas[i].x > width - 160) {
      bolas.splice(i, 1);
    }
  }

  for (let i = sangue.length - 1; i >= 0; i--) {
    sangue[i].update();
    sangue[i].show();
    if (sangue[i].lifetime <= 0) {
      sangue.splice(i, 1);
    }
  }

  if (fraseExibida) {
    fill(255);
    text("De quem é a ordem?", width / 2, height / 2);
  }

  if (sangueAtivo && manchasSangue.length > 0) {
    for (let mancha of manchasSangue) {
      mancha.update();
      mancha.show();
    }
    
    if (manchasSangue.length >= 12) {
      disparou = false;
      fraseExibida = false;
      balas = [];
      bolas = [];
      sangue = [];
      sangueAtivo = false;
      manchasSangue = [];
      tiros3D = [];
      pararSons();
    }
  }
}

function mousePressed() {
  if (!disparou) {
    disparou = true;
    fraseExibida = true;
    balas = [];
    bolas = [];
    sangue = [];
    tiros3D = [];
    
    if (somTiro && somTiro.isLoaded()) {
      somTiro.play();
    }

    for (let i = 0; i < 6; i++) {
      let offsetY = random(-15, 15);
      balas.push(new Bala(250, height * 0.75 + offsetY));
    }
  }
}

function pararSons() {
  if (somTiro && somTiro.isPlaying()) {
    somTiro.stop();
  }
  if (somPingPong && somPingPong.isPlaying()) {
    somPingPong.stop();
  }
}

class Bala {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.originalY = y;
    this.speed = random(1.5, 2.5);
    this.hit = false;
    this.trail = [];
    this.size = random(6, 8);
  }

  update() {
    this.x -= this.speed;
    this.y = this.originalY + sin(frameCount * 0.05 + this.x * 0.01) * 0.5;

    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 6) this.trail.shift();

    if (this.x < 180 && !this.hit) {
      this.hit = true;
      let yHead = this.y - 20;
      sangue.push(new ManchaSangue(this.x, yHead));
      bolas.push(new Bola(this.x, yHead));
      
      for (let i = 0; i < 3; i++) {
        let offsetX = random(-20, 20);
        let offsetY = random(-20, 20);
        tiros3D.push(new Tiro3D(this.x + offsetX, yHead + offsetY));
      }
      
      if (!sangueAtivo) {
        sangueAtivo = true;
        manchasSangue.push(new ManchaSangueCrescente(this.x, yHead));
      }
      
      if (somPingPong && somPingPong.isLoaded()) somPingPong.play();
    }
  }

  show() {
    if (!this.hit) {
      noStroke();
      
      for (let i = 0; i < this.trail.length; i++) {
        let alpha = map(i, 0, this.trail.length - 1, 15, 100);
        let size = map(i, 0, this.trail.length - 1, this.size * 1.2, this.size);
        
        fill(80, 80, 80, alpha);
        ellipse(this.trail[i].x, this.trail[i].y, size);
      }

      fill(180, 150, 50);
      ellipse(this.x, this.y, this.size * 1.5);
      
      fill(100, 100, 100);
      ellipse(this.x - this.size, this.y, this.size);
      
      fill(220, 200, 100, 120);
      ellipse(this.x + this.size * 0.3, this.y - this.size * 0.3, this.size * 0.4);
    }
  }
}

class Bola {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speed = 4;
    this.bounce = 0;
    this.maxBounces = 3;
    this.hitSecondBoy = false;
    this.soundPlayed = false;
  }

  update() {
    this.x += this.speed;
    this.y += sin(frameCount * 0.2) * 1.5;
    
    if (this.x > width - 150 && !this.hitSecondBoy) {
      this.hitSecondBoy = true;
      sangue.push(new ManchaSangue(this.x, this.y));
      
      if (!this.soundPlayed && somPingPong && somPingPong.isLoaded()) {
        somPingPong.play();
        this.soundPlayed = true;
      }
    }
    
    if (this.x > width - 50) {
      let index = bolas.indexOf(this);
      if (index > -1) {
        bolas.splice(index, 1);
      }
    }
  }

  show() {
    fill(255);
    stroke(200);
    strokeWeight(1);
    ellipse(this.x, this.y, 10);
    
    fill(240);
    ellipse(this.x - 1, this.y - 1, 5);
  }
}

class ManchaSangue {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.lifetime = 255;
    this.pingos = [];
    this.sparks = [];

    for (let i = 0; i < 15; i++) {
      this.pingos.push({
        x: random(-20, 20),
        y: random(-20, 20),
        r: random(3, 12),
        vy: random(1, 3),
        vx: random(-2, 2)
      });
    }
    
    for (let i = 0; i < 8; i++) {
      this.sparks.push({
        x: random(-10, 10),
        y: random(-10, 10),
        vx: random(-5, 5),
        vy: random(-5, 5),
        life: 255
      });
    }
  }

  update() {
    this.lifetime -= 3;
    
    for (let p of this.pingos) {
      p.y += p.vy;
      p.x += p.vx;
      p.vy += 0.1;
    }
    
    for (let s of this.sparks) {
      s.x += s.vx;
      s.y += s.vy;
      s.life -= 5;
    }
  }

  show() {
    noStroke();
    
    for (let s of this.sparks) {
      if (s.life > 0) {
        fill(255, 255, 0, s.life);
        ellipse(this.x + s.x, this.y + s.y, 3);
      }
    }
    
    fill(150, 0, 0, this.lifetime);
    for (let p of this.pingos) {
      ellipse(this.x + p.x, this.y + p.y, p.r);
    }
    
    fill(255, 100, 100, this.lifetime * 0.3);
    ellipse(this.x, this.y, 20);
  }
}

class ManchaSangueCrescente {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 3;
    this.maxRadius = 80;
    this.growthSpeed = 1.5;
    this.cobertura = 0;
    this.tempoVida = 0;
    this.maxTempoVida = 120;
    this.criouFilha = false;
  }

  update() {
    this.radius += this.growthSpeed;
    this.tempoVida++;
    this.cobertura = (this.radius / this.maxRadius) * 100;
    
    if (this.radius >= this.maxRadius && !this.criouFilha && manchasSangue.length < 15) {
      this.criarNovaMancha();
      this.criouFilha = true;
    }
    
    if (manchasSangue.length >= 10) {
      pararSons();
    }
  }

  criarNovaMancha() {
    let novoX = this.x + random(-100, 100);
    let novoY = this.y + random(-100, 100);
    
    novoX = constrain(novoX, 50, width - 50);
    novoY = constrain(novoY, 50, height - 50);
    
    manchasSangue.push(new ManchaSangueCrescente(novoX, novoY));
  }

  show() {
    noStroke();
    
    fill(120, 0, 0, 80);
    ellipse(this.x, this.y, this.radius * 2);
    
    fill(80, 0, 0, 60);
    ellipse(this.x, this.y, this.radius * 1.8);
    
    fill(150, 20, 20, 70);
    ellipse(this.x, this.y, this.radius * 0.6);
    
    for (let i = 0; i < 8; i++) {
      let angle = random(TWO_PI);
      let dist = this.radius + random(-5, 5);
      let px = this.x + cos(angle) * dist;
      let py = this.y + sin(angle) * dist;
      
      fill(100, 0, 0, 60);
      ellipse(px, py, random(2, 6));
    }
  }
}

class Tiro3D {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.z = 0;
    this.speed = random(3, 6);
    this.size = random(8, 15);
    this.alpha = 255;
    this.trail = [];
    this.maxZ = 200;
  }

  update() {
    this.z += this.speed;
    this.alpha = map(this.z, 0, this.maxZ, 255, 0);
    
    this.trail.push({ x: this.x, y: this.y, z: this.z, size: this.size });
    if (this.trail.length > 10) this.trail.shift();
    
    this.size = map(this.z, 0, this.maxZ, 8, 25);
  }

  show() {
    if (this.z < this.maxZ) {
      noStroke();
      
      for (let i = 0; i < this.trail.length; i++) {
        let pos = this.trail[i];
        let alpha = map(i, 0, this.trail.length - 1, 50, this.alpha);
        let size = map(i, 0, this.trail.length - 1, pos.size * 0.5, pos.size);
        
        fill(255, 150, 50, alpha);
        ellipse(pos.x, pos.y, size);
        
        fill(255, 255, 200, alpha * 0.6);
        ellipse(pos.x, pos.y, size * 0.6);
      }
      
      fill(180, 150, 50, this.alpha);
      ellipse(this.x, this.y, this.size * 1.5);
      
      fill(120, 120, 120, this.alpha);
      ellipse(this.x, this.y, this.size);
      
      fill(220, 200, 100, this.alpha * 0.8);
      ellipse(this.x - this.size * 0.2, this.y - this.size * 0.2, this.size * 0.4);
    }
  }

  isFinished() {
    return this.z >= this.maxZ;
  }
}
