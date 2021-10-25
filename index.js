const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

// Define wight and height
const cellsHorizontal = 14;
const cellsVertical = 10;
const width = window.innerWidth;
const height = window.innerHeight - 5;

const unitLengthX = width / cellsHorizontal;
const unitLengthY = height / cellsVertical;

const engine = Engine.create();
// disable gravity
engine.world.gravity.y = 0;
// destructuring world from engine
const { world } = engine;
const render = Render.create({
	element: document.body,
	engine: engine,
	options: {
		wireframes: false,
		width: width,
		height: height,
	},
});
Render.run(render);
Runner.run(Runner.create(), engine);

// Walls
const walls = [
	Bodies.rectangle(width / 2, 0, width, 2, { isStatic: true }),
	Bodies.rectangle(width / 2, height, width, 2, { isStatic: true }),
	Bodies.rectangle(0, height / 2, 2, height, { isStatic: true }),
	Bodies.rectangle(width, height / 2, 2, height, { isStatic: true }),
];
World.add(world, walls);

// Maze generation

// Shuffle cells
const shuffle = (arr) => {
	let counter = arr.length;

	while (counter > 0) {
		let index = Math.floor(Math.random() * counter);

		counter--;

		const temp = arr[counter];
		arr[counter] = arr[index];
		arr[index] = temp;
	}

	return arr;
};

const grid = Array(cellsVertical)
	.fill(null)
	.map(() => {
		return Array(cellsHorizontal).fill(false);
	});

const verticals = Array(cellsVertical)
	.fill(null)
	.map(() => {
		return Array(cellsHorizontal - 1).fill(false);
	});

const horizontals = Array(cellsHorizontal - 1)
	.fill(null)
	.map(() => {
		return Array(cellsHorizontal).fill(false);
	});

const startRow = Math.floor(Math.random() * cellsVertical);
const startColumn = Math.floor(Math.random() * cellsHorizontal);

// Generate a maze starting from a random cell
const stepThroughCell = (row, column) => {
	// If I have visited the cell grid[row, column], then return
	if (grid[row][column]) {
		return;
	}

	// Mark this cell as being visited
	grid[row][column] = true;

	//  Assemble randomly-ordered list of neighbors
	const neighbors = shuffle([
		[row - 1, column, "up"],
		[row, column + 1, "right"],
		[row + 1, column, "down"],
		[row, column - 1, "left"],
	]);
	// For each neifhbor...

	for (let neighbor of neighbors) {
		const [nextRow, nextColumn, direction] = neighbor;
		// See if that neighbor is out of reach
		if (
			nextRow < 0 ||
			nextRow >= cellsVertical ||
			nextColumn < 0 ||
			nextColumn >= cellsHorizontal
		) {
			continue;
		}
		// If we have visited that neighbor, continue to next neighbor
		if (grid[nextRow][nextColumn]) {
			continue;
		}
		// Remove a wall from either horizontals or verticals
		if (direction === "left") {
			verticals[row][column - 1] = true;
		} else if (direction === "right") {
			verticals[row][column] = true;
		} else if (direction === "up") {
			horizontals[row - 1][column] = true;
		} else if (direction === "down") {
			horizontals[row][column] = true;
		}
		stepThroughCell(nextRow, nextColumn);
	}
};

// Visit that next cell

stepThroughCell(startRow, startColumn);

horizontals.forEach((row, rowIndex) => {
	row.forEach((open, columnIndex) => {
		if (open) {
			return;
		}

		const wall = Bodies.rectangle(
			columnIndex * unitLengthX + unitLengthX / 2,
			rowIndex * unitLengthY + unitLengthY,
			unitLengthX,
			1,
			{
				label: "wall",
				isStatic: true,
				render: {
					fillStyle: "red",
				},
			}
		);
		World.add(world, wall);
	});
});

verticals.forEach((row, rowIndex) => {
	row.forEach((open, columnIndex) => {
		if (open) {
			return;
		}

		const wall = Bodies.rectangle(
			columnIndex * unitLengthX + unitLengthX,
			rowIndex * unitLengthY + unitLengthY / 2,
			1,
			unitLengthY,
			{
				label: "wall",
				isStatic: true,
				render: {
					fillStyle: "red",
				},
			}
		);
		World.add(world, wall);
	});
});

// Goal
const goal = Bodies.rectangle(
	width - unitLengthX / 2,
	height - unitLengthY / 2,
	unitLengthX * 0.7,
	unitLengthY * 0.7,
	{
		isStatic: true,
		label: "goal",
		render: {
			fillStyle: "green",
		},
	}
);
World.add(world, goal);

// Ball
const ballRadius = Math.min(unitLengthX, unitLengthY) / 4;
const ball = Bodies.circle(unitLengthX / 2, unitLengthY / 2, ballRadius, {
	label: "ball",
	render: {
		fillStyle: "orange",
	},
});
World.add(world, ball);

document.addEventListener("keydown", (event) => {
	const { x, y } = ball.velocity;

	if (event.keyCode === 87) {
		// up
		Body.setVelocity(ball, { x: x, y: y - 5 });
	}
	if (event.keyCode === 68) {
		// right
		Body.setVelocity(ball, { x: x + 5, y: y });
	}
	if (event.keyCode === 83) {
		// down
		Body.setVelocity(ball, { x: x, y: y + 5 });
	}
	if (event.keyCode === 65) {
		// left
		Body.setVelocity(ball, { x: x - 5, y: y });
	}
});

// Win condition

const winMessage = document.querySelector(".winner");
Events.on(engine, "collisionStart", (event) => {
	event.pairs.forEach((collision) => {
		const labels = ["ball", "goal"];

		if (
			labels.includes(collision.bodyA.label) &&
			labels.includes(collision.bodyB.label)
		) {
			world.gravity.y = 1;
			world.bodies.forEach((body) => {
				if (body.label === "wall") {
					Body.setStatic(body, false);
				}
			});
			winMessage.classList.remove("hidden");
		}
	});
});
