import {createHash} from 'node:crypto';
export const projectKey=id=>createHash('sha256').update(id.toLowerCase()).digest('hex');
