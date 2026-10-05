import http from 'node:http';
import { readFile, stat, mkdir, appendFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { randomUUID, createHash } from 'node:crypto';

const directory=path.dirname(fileURLToPath(import.meta.url));
const publicRoot=path.join(directory,'public');
const dataRoot=process.env.SCS_DATA_DIR||path.join(directory,'.data');
const port=Number(process.env.PORT||4173);
const host=process.env.HOST||'127.0.0.1';
const allowedOrigins=new Set(['https://charlieforward9.github.io',...(process.env.SCS_ALLOWED_ORIGINS||'').split(',').filter(Boolean)]);
const rates=new Map();
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2','.ttf':'font/ttf','.txt':'text/plain; charset=utf-8'};

function json(response,status,body){response.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});response.end(JSON.stringify(body));}
function validOrigin(request){const origin=request.headers.origin;if(!origin)return false;try{const url=new URL(origin);return allowedOrigins.has(origin)||url.host===request.headers.host;}catch{return false;}}
async function readBody(request){let size=0;const buffers=[];for await(const chunk of request){size+=chunk.length;if(size>10000)throw Object.assign(new Error('Request too large.'),{status:413});buffers.push(chunk);}try{return JSON.parse(Buffer.concat(buffers).toString());}catch{throw Object.assign(new Error('Please submit valid form data.'),{status:400});}}
function validate(input){if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Please submit valid form data.');const clean={};for(const [key,max] of Object.entries({name:100,email:200,date:10,venue:180,package:40,message:2500,vibe:80,company:200})){if(typeof input[key]!=='string'||input[key].length>max)throw new Error('One or more fields is invalid or too long.');clean[key]=input[key].trim();}if(clean.company)return null;if(!clean.name||!clean.venue||!/^\S+@\S+\.\S+$/.test(clean.email))throw new Error('Please include your name, email, and venue.');if(!/^\d{4}-\d{2}-\d{2}$/.test(clean.date)||Number.isNaN(Date.parse(clean.date))||new Date(clean.date+'T12:00:00Z').toISOString().slice(0,10)!==clean.date)throw new Error('Please choose a valid event date.');if(!['Still deciding','Reception','Ceremony & Reception','All-Day Audio'].includes(clean.package))throw new Error('Please select a listed package.');delete clean.company;return clean;}

const server=http.createServer(async(request,response)=>{
  response.setHeader('X-Content-Type-Options','nosniff');response.setHeader('Referrer-Policy','strict-origin-when-cross-origin');response.setHeader('X-Robots-Tag','noindex, nofollow');
  let pathname;try{pathname=decodeURIComponent(new URL(request.url,'http://localhost').pathname);}catch{return json(response,400,{error:'Invalid path.'});}
  if(pathname.startsWith('/api/')){
    if(request.headers.origin&&validOrigin(request)){response.setHeader('Access-Control-Allow-Origin',request.headers.origin);response.setHeader('Vary','Origin');response.setHeader('Access-Control-Allow-Methods','POST, OPTIONS');response.setHeader('Access-Control-Allow-Headers','Content-Type');}
    if(request.method==='OPTIONS'){if(!validOrigin(request))return json(response,403,{error:'Origin not allowed.'});response.writeHead(204);return response.end();}
    if(pathname!=='/api/inquiries'||request.method!=='POST')return json(response,404,{error:'Not found.'});
    if(!validOrigin(request))return json(response,403,{error:'Origin not allowed.'});
    if(!String(request.headers['content-type']).startsWith('application/json'))return json(response,415,{error:'JSON is required.'});
    const key=createHash('sha256').update(String(request.headers['cf-connecting-ip']||request.socket.remoteAddress)).digest('hex').slice(0,24),now=Date.now();
    let rate=rates.get(key);if(!rate||now-rate.start>600000){rate={start:now,count:0};rates.set(key,rate);}if(++rate.count>8)return json(response,429,{error:'Too many preview inquiries. Please try again in a few minutes.'});
    if(rates.size>2000)for(const [entry,value]of rates)if(now-value.start>600000)rates.delete(entry);
    try{const input=await readBody(request);const fields=validate(input);if(!fields)return json(response,200,{ok:true,preview:true});const inquiry={id:randomUUID(),createdAt:new Date().toISOString(),preview:true,...fields};await mkdir(dataRoot,{recursive:true,mode:0o700});await appendFile(path.join(dataRoot,'inquiries.jsonl'),JSON.stringify(inquiry)+'\n',{mode:0o600});console.log('Preview inquiry saved:',inquiry.id);return json(response,201,{ok:true,id:inquiry.id,preview:true});}catch(error){const clientError=error.status||(!(error.code)?400:500);return json(response,clientError,{error:clientError<500?error.message:'The preview inbox could not save the inquiry. Please try again.'});}
  }
  if(!['GET','HEAD'].includes(request.method))return json(response,405,{error:'Method not allowed.'});
  if(pathname==='/health')return json(response,200,{ok:true,service:'space-coast-sounds-preview',preview:true});
  const filePath=path.resolve(publicRoot,'.'+(pathname==='/'?'/index.html':pathname));
  if(!filePath.startsWith(publicRoot+path.sep)||!mime[path.extname(filePath)])return json(response,404,{error:'Not found.'});
  try{const info=await stat(filePath);if(!info.isFile())return json(response,404,{error:'Not found.'});const content=await readFile(filePath);response.writeHead(200,{'Content-Type':mime[path.extname(filePath)],'Cache-Control':'no-cache'});response.end(request.method==='HEAD'?undefined:content);}catch{return json(response,404,{error:'Not found.'});}
});
server.listen(port,host,()=>console.log(`Space Coast Sounds preview: http://${host}:${port}\nPrivate preview inbox: ${dataRoot}/inquiries.jsonl`));
