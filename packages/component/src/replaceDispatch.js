import { DISPATCH } from './symbols';


export default function(dispatch) {
  global[DISPATCH] = dispatch;
}
