import { DISPATCHER } from './symbols';


export default function(dispatcher) {
  global[DISPATCHER] = dispatcher;
}
