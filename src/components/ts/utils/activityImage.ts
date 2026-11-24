export async function prepareActivityImage(file:File, avatar=false):Promise<File> {
    if (!file.type.startsWith("image/") || file.type==="image/svg+xml" || file.size>20*1024*1024) throw new Error("image");
    const src=URL.createObjectURL(file);
    try {
        const image=new Image();
        await new Promise<void>((resolve,reject)=>{image.onload=()=>resolve();image.onerror=reject;image.src=src;});
        const w=image.naturalWidth,h=image.naturalHeight;
        if(!w || !h || w*h>65000000) throw new Error("size");
        const cropW=avatar?Math.min(w,h):w,cropH=avatar?Math.min(w,h):h;
        let scale=Math.min(1,(avatar?512:1600)/Math.max(cropW,cropH));
        const canvas=document.createElement("canvas");
        for(let attempt=0;attempt<4;attempt++){
            canvas.width=Math.max(1,Math.round(cropW*scale));
            canvas.height=Math.max(1,Math.round(cropH*scale));
            const ctx=canvas.getContext("2d");
            if(!ctx) throw new Error("canvas");
            ctx.fillStyle="#fff";ctx.fillRect(0,0,canvas.width,canvas.height);
            ctx.drawImage(image,(w-cropW)/2,(h-cropH)/2,cropW,cropH,0,0,canvas.width,canvas.height);
            const blob=await new Promise<Blob | null>(resolve=>canvas.toBlob(resolve,"image/jpeg",0.83));
            if(blob && blob.size<=800000) return new File([blob],"activity.jpg",{type:"image/jpeg"});
            scale*=0.72;
        }
        throw new Error("size");
    } finally { URL.revokeObjectURL(src); }
}

export function activityAvatarUrl(id:number|string,key:string) {
    const share=new URLSearchParams(window.location.search).get("share");
    return "/api/habits/"+id+"/avatar/"+encodeURIComponent(key)+(share?"?share="+encodeURIComponent(share):"");
}
export const commentPhotoUrl=(id:string|number,date:string,key:string)=>
    "/api/habits/"+id+"/comment-photos/"+date+"/"+encodeURIComponent(key);

