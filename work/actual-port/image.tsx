import React from 'react';
export default function Image({priority,unoptimized,fill,quality,placeholder,blurDataURL,onLoadingComplete,...props}:any){return <img {...props} style={{...(fill?{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}:{}),...props.style}}/>}
