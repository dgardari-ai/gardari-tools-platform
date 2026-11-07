import {LESSONS} from './lessons-data.js';
const SESSION='gardari-account-demo:v1', SAVED='gardari-learning:v1';
export function createAccountState() {
 let signed=false, saved=[];
 try {signed=sessionStorage.getItem(SESSION)==='active';}catch{}
 const refresh=()=>{try{const value=JSON.parse(localStorage.getItem(SAVED)||'[]');saved=Array.isArray(value)?[...new Set(value.filter(id=>LESSONS.some(x=>x.id===id)))]:[];}catch{saved=[];}};
 refresh();
 return {signedIn:()=>signed,signInDemo(){signed=true;try{sessionStorage.setItem(SESSION,'active');}catch{}},signOut(){signed=false;try{sessionStorage.removeItem(SESSION);}catch{}},savedLessons:()=>[...saved],toggleLesson(id){if(!LESSONS.some(x=>x.id===id))return false;saved=saved.includes(id)?saved.filter(x=>x!==id):[...saved,id];try{localStorage.setItem(SAVED,JSON.stringify(saved));}catch{}return saved.includes(id);},refresh,key:SAVED};
}
