var game = {
	width: 640,
	height: 360,
	ctx: undefined, //Для хранения контекста
	platform: undefined,
	ball: undefined, 
	rows: 6,  //Количество строк блоков
	cols: 8, // Количество столбцов блоков
	running: true, //Игра запущена
	score: 0,
	blocks: [],
	sprites: {
		background: undefined,
		platform: undefined,
		ball:undefined,
		block: undefined
	},

	init: function(){
		
		var canvas = document.getElementById ("mycanvas"); //Получили элемент canvas из HTML
		this.ctx = canvas.getContext("2d");  //Берем контекст для двумерной графики

		window.addEventListener("keydown", function (e){     //При нажатии клавиши влево или вправо платформа перемещается
    		if ( e.keyCode == 37 ) {						
    			game.platform.dx = -game.platform.velocity;
    		} else if ( e.keyCode == 39 ) {
    			game.platform.dx = game.platform.velocity;
    		} else if ( e.keyCode == 32 ) { 				//При нажатии пробела мяч покидает платформу
    			game.platform.releaseBall();
    		}

    	});

		window.addEventListener("keyup", function (e){ //Если отпустить клавишу платформа останавливается
			game.platform.stop ();
    	});
	},
	load: function(){							//Загружает изображения
		for ( var key in this.sprites ){
		this.sprites[key] = new Image();
		this.sprites[key].src = "images/" + key + ".png";
		}
	},
	create: function(){							//Создает сетку из блоков
		for (var row = 0; row < this.rows; row++ ){
		    for (var col = 0; col < this.cols; col++ ){
			    this.blocks.push({
				   x: 68 * col + 50,
				   y: 38 * row + 35,
				   width:64,
				   height:32,
				   isAlive: true
			    });
		    }
		}
	},
	start: function(){					//Последовательность действий при старте игры
		this.init();
		this.load();
		this.create();
		this.run();
	},
	render: function(){										//Рисуем изображения
		this.ctx.clearRect(0, 0, this.width, this.height); //Очищаем экран перед каждой отрисовкой 
		this.ctx.drawImage(this.sprites.background, 0, 0);
		this.ctx.drawImage(this.sprites.platform, this.platform.x, this.platform.y);
		this.ctx.drawImage(this.sprites.ball, this.ball.width * this.ball.frame, 0, this.ball.width, this.ball.height, this.ball.x, this.ball.y, this.ball.width, this.ball.height);
		this.blocks.forEach(function(element){
			if (element.isAlive) {
				this.ctx.drawImage(this.sprites.block, element.x, element.y);
			}	
		}, this);
		
	},

	update: function(){
		if ( this.ball.collide (this.platform) ) { //Проверяем столкновение с платформой
		this.ball.bumpPlatform (this.platform);
		}

		if ( this.platform.dx ) {  //Если скорость платформы != 0, то запускаем функцию движение платформы.
		this.platform.move();
		}
		if ( this.ball.dx || this.ball.dy ) { //Если скорость мяча != 0, то запускаем функцию движение мяча.
		this.ball.move();
		}

		this.blocks.forEach(function(element){ //Проверяем столкновение с блоком
			if (element.isAlive) {				//Столкновение с блоком проверяется только при условии что блок активен
				if ( this.ball.collide (element) ) {
				this.ball.bumpBlock (element);
				}
			}
			
		}, this);

		this.ball.checkBounds();
	},

	run: function(){
		this.update();
		this.render();

		if ( this.running ) {
		window.requestAnimationFrame(function(){ //Перерисовываем изображение
			game.run();
		});
	}

	},
	over: function ( message ){ //Конец игры
		alert (message);
		this.running = false;
		window.location.reload();  //Перезапускаем экран
	}
};

game.ball = {
	width: 22,
	height: 22,
	frame: 0, //Определяет какую часть мяча отображать при отрисовке, для создания эффекта вращения.
	x: 340,
	y: 278,
	dx: 0,
	dy: 0,
	velocity: 3, //Максимальная скорость мяча
	jump: function(){  //Мяч отрывается от платформы
		this.dy = -this.velocity;
		this.dx = -this.velocity;
	},
	animate: function(){ //Анимация вращения мяча
		setInterval (function(){
			++game.ball.frame;

			if ( game.ball.frame > 3 ) {
				 game.ball.frame = 0
			}
		}, 150);
		
	},

	move: function(){ //Движение мяча
		this.y += this.dy;
		this.x += this.dx;
		this.animate(); //При движении осуществляется анмация вращения
	},

	collide: function(element){ //Проверяем на столкновение с элементом (патформа, блок)
		var x = this.x + this.dx;
		var y = this.y + this.dy;

		if ( x + this.width > element.x &&
			x < element.x + element.width &&
			y + this.height > element.y &&
			y < element.y + element.height
		   ) {
			return true;
		}

		return false;
	},

	bumpBlock: function(block){ //При столкновении с блоком меняем его скорость по у на противоположную
		this.dy *= -1;
		block.isAlive = false;
		++game.score;

		if ( game.score >= game.blocks.length ) { // Если все блоки уничтожены, то победа.
			game.over ( "You Win!" )
		}
	},

	onTheLeftSide: function(platform) { //Проверяем на какой стороне платформы находится мяч. Если на леаой то возвращаем true.
		return ( this.x + this.width / 2 ) < ( platform.x + platform.width / 2 )
	},

	bumpPlatform: function(platform){
		this.dy = -this.velocity;
		this.dx = this.onTheLeftSide(platform) ? -this.velocity : this.velocity;//мяч отскакиевает влево с левой стороны платформы, иначе вправо
	},


	checkBounds: function(){ //Проверяем столкновение со стеной
		var x = this.x + this.dx; //Проверку ведем на следующем кадре анимации, что бы мяч не перекрывал стену
		var y = this.y + this.dy;	

		if ( x < 0 ) {
			this.x = 0;
			this.dx = this.velocity;
		} else if ( x + this.width > game.width ) {
			this.x = game.width - this.width;
			this.dx = -this.velocity;
		} else if ( y < 0 ) {
			this.y = 0;
			this.dy = this.velocity;

		} else if ( y + this.height > game.height ) { 
			game.over ("Game Over");
		}
	}
}

game.platform = {
	x: 300,
	y: 300,
	velocity: 6,
	dx: 0,
	ball: game.ball,
	width: 104,
	height: 24,

	
	releaseBall: function(){
		if ( this.ball ) {
			this.ball.jump();
			this.ball = false;
		}
	},

	move: function (){
		this.x += this.dx;

		if ( this.ball ) {
			this.ball.x += this.dx;
		}
	},
	stop: function(){
		this.dx = 0;

		if ( this.ball ) {
		this.ball.dx = 0;
		}
	},

}

window.addEventListener("load", function (){ //Стартуем игру после загрузки страницы
    game.start();
});
