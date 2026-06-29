import morgan from 'morgan';
import { env } from '../config/env.js';
const requestLogger = morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined');
export default requestLogger;
