/** 
 * Runge-Kutta spring physics function generator. Adapted from Framer.js and VelocityJS, copyright Koen Bok. 
 * MIT License: http://en.wikipedia.org/wiki/MIT_License
 *
 * Given a tension, friction, and duration, a simulation at 60FPS will first run without a defined duration in order to calculate the full path. 
 * A second pass then adjusts the time delta -- using the relation between actual time and duration -- to calculate the path for the 
 * duration-constrained animation. 
 */

interface springState {
  x: number;
  v: number;
  tension: number;
  friction: number;
}

interface springDelta {
  dx: number;
  dv: number;
}

function springAccelerationForState(state: springState) {
  return (-state.tension * state.x) - (state.friction * state.v);
}

function springEvaluateStateWithDerivative(initialState: springState, dt: number, derivative: springDelta): springDelta {
  const state = {
    x: initialState.x + derivative.dx * dt,
    v: initialState.v + derivative.dv * dt,
    tension: initialState.tension,
    friction: initialState.friction,
  };

  return {
    dx: state.v,
    dv: springAccelerationForState(state),
  };
}

function springIntegrateState(state: springState, dt: number) {
  const a = {
    dx: state.v,
    dv: springAccelerationForState(state),
  },
    b = springEvaluateStateWithDerivative(state, dt * 0.5, a),
    c = springEvaluateStateWithDerivative(state, dt * 0.5, b),
    d = springEvaluateStateWithDerivative(state, dt, c),
    dxdt = 1 / 6 * (a.dx + 2 * (b.dx + c.dx) + d.dx),
    dvdt = 1 / 6 * (a.dv + 2 * (b.dv + c.dv) + d.dv);

  state.x = state.x + dxdt * dt;
  state.v = state.v + dvdt * dt;

  return state;
}

function generateSpring(tension: number, friction: number): number;
function generateSpring(tension: number, friction: number, duration: number): Function;
function generateSpring(tension: number, friction: number, duration?: number): any {
  const initState: springState = {
    x: -1,
    v: 0,
    tension: parseFloat(tension as any) || 500,
    friction: parseFloat(friction as any) || 20,
  };

  const path = [0];
  const tolerance = 1 / 10000;
  const DT = 16 / 1000;

  let timeLapsed = 0;
  let dt: number;
  let lastState: springState = initState;

  /* Calculate the actual time it takes for this animation to complete with the provided conditions. */
  if (duration) {
    /* Run the simulation without a duration. */
    timeLapsed = generateSpring(initState.tension, initState.friction);
    /* Compute the adjusted time delta. */
    dt = (timeLapsed as number) / duration * DT;
  } else {
    dt = DT;
  }

  let isNotSteadyState = true;
  while (isNotSteadyState) {
    /* Next/step function .*/
    lastState = springIntegrateState(lastState, dt);
    /* Store the position. */
    path.push(1 + lastState.x);
    timeLapsed += 16;

    /* If the change threshold is reached, break. */
    isNotSteadyState = !(Math.abs(lastState.x) > tolerance && Math.abs(lastState.v) > tolerance);
  }

  /*
   * If duration is not defined, return the actual time required for completing this animation.
	 * Otherwise, return a closure that holds the computed path and returns a snapshot of the position 
   * according to a given percentComplete. 
   */
  return !duration ? timeLapsed : (percentComplete: number) => {
    if (percentComplete === 0) {
      return 0;
    }
    if (percentComplete === 1) {
      return 1;
    }

    return path[Math.floor(percentComplete * (path.length - 1))];
  };
}

export function spring(tension: number, friction: number, duration: number): Function {
  return generateSpring(tension, friction, duration);
}
