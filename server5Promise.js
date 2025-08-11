import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import multer from 'multer';
import { CohereClient } from 'cohere-ai';
import { generateImage, generateSocialMediaIdeaPrompt } from './textToImage.js';
import OpenAI from 'openai';
import path from 'path'
import fs from 'fs'
import { fontCatalog } from './fonts.js';
import { PassThrough } from 'stream';

const app = express();
const PORT = 5001;
dotenv.config();



const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY // ✅ or hardcode for testing
});


// Allow only frontend origin
app.use(cors({ origin: 'https://ccf-pilot-frontend-xmcz.vercel.app'}));//change to public url
app.use(bodyParser.json());
app.use(express.json());
app.use("/uploads", express.static("uploads"));



const upload = multer({ dest: "uploads/" });

/*curl -X POST http://localhost:5001/identify-image \
  -H "Content-Type: multipart/form-data" \
  -F "image=@/c/Users/JoeJo/Downloads/XyAaqBEtYtb8YffjKZ68Gb.jpg"*/ //to test identify-image endpoint



app.post("/pressRelease", upload.fields([{ name: "albumArtFiles", maxCount: 10 }, { name: "artistProfilePhotoFiles", maxCount: 10 },]), async (req, res) => {

res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    res.flushHeaders();

    const encoder = new TextEncoder();
    const passThrough = new PassThrough();
    // Send initial connection message
    passThrough.pipe(res);
    passThrough.write('data: Pdf pipeline is open!!\n\n');




    console.log('Files:', req.files);         // array of uploaded files
  console.log('Text fields:', req.body);

  console.log("Album Art Files:", req.files.albumArtFiles); // array
    console.log("Press Photos Files:", req.files.artistProfilePhotoFiles); // array

  let { name, email, genre, targetAudience, socialPrescence, uniqueAngles, artistPersonalQuote, offstageDetailOrCause, primaryContactEmail, additionalLinks, keyInfluences, biggestMilestones, noticeablePress, upcomingDates, websiteUrl, trackList } = req.body;

console.log("name:", name);
console.log("email:", email);
console.log("genre:", genre);
console.log("targetAudience:", targetAudience);
console.log("socialPrescence:", socialPrescence);
console.log("uniqueAngles:", uniqueAngles);
console.log("artistPersonalQuote:", artistPersonalQuote);
console.log("offstageDetailOrCause:", offstageDetailOrCause);
console.log("primaryContactEmail:", primaryContactEmail);
console.log("additionalLinks:", additionalLinks);
console.log("keyInfluences:", keyInfluences);
console.log("biggestMilestones:", biggestMilestones);
console.log("noticeablePress:", noticeablePress);
console.log("upcomingDates:", upcomingDates);
console.log("websiteUrl:", websiteUrl);
console.log("trackList:", trackList);

let artistProfilePhotoFilesList = []
  let albumArtFilesList = []

  for (const file of req.files.albumArtFiles) {
    albumArtFilesList.push(file)
  }

  for (const file of req.files.artistProfilePhotoFiles) {
    artistProfilePhotoFilesList.push(file)
  }

  console.log("albumArtFilesList is: ", albumArtFilesList);
  console.log("artistProfilePhotoFilesList is: ", artistProfilePhotoFilesList)

  

  //let formattedTestTrackList = testTrackList.map((title, index) => `Track ${index}: ${title}`).join('\n')
  if (typeof trackList === 'string') {
    trackList = JSON.parse(trackList);
  }
  let formattedTrackList = trackList.map((title, index) => `Track ${index}: ${title}`).join('\n')



  console.log("value of formattedTrackList is: ", formattedTrackList)


  //1 - extracting image from frontend sent
  
  //add extraction of album art and artist profile pic

  if (!albumArtFilesList && artistProfilePhotoFilesList) {
    throw new Error("No uploaded albumArtFiles or artistProfilePhotoFiles found.");
  }

  //const base64Image = fs.readFileSync(uploadedImagePath, { encoding: 'base64' });

  let base64ImageURLCollection = []

  artistProfilePhotoFilesList.forEach((file) => {
    let base64Image = fs.readFileSync(file.path, { encoding: 'base64' });
    base64ImageURLCollection.push(`data:image/jpeg;base64,${base64Image}`)
  })

  albumArtFilesList.forEach((file) => {
    let base64Image = fs.readFileSync(file.path, { encoding: 'base64' });
    base64ImageURLCollection.push(`data:image/jpeg;base64,${base64Image}`)
  })

  console.log("value of base64ImageURLCollection is: ", base64ImageURLCollection);

  // Construct the OpenAI message content array
const imageContentArray = base64ImageURLCollection.map((url) => ({
  type: "image_url",
  image_url: {
    url: url
  }
}));

// Add a text prompt at the beginning
imageContentArray.unshift({
  type: "text",
  text: `Describe the aesthetics, mood, colors, fashion, and visual style of artist ${name} in these images. The aim is to use your generated specification to create a logo for the artist.`
});

  //2 - use gpt-vision language model to xtract details from the image:
  const visionResponse = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [
    {
      role: "system",
      content: "You are an assistant that analyzes visuals for artistic and thematic insights."
    },
    {
      role: "user",
      content: imageContentArray
    }
  ],
  max_tokens: 300
});

const visionDescriptionForLogo = visionResponse.choices[0].message.content;
console.log("🖼️ Vision insight for logo context:", visionDescriptionForLogo);
console.log("🖼️ The length of Vision insight for logo context is:", visionDescriptionForLogo.length)

 //1 - Press Release Prompt and LLM Call

  let artistDetail = `Genre: ${genre},
  Target Audience: ${targetAudience},
  Social Prescence: ${socialPrescence},
  Unique Angles: ${uniqueAngles},
  Artist Personal Quote: ${artistPersonalQuote},
  Key Influences: ${keyInfluences},
  Biggest Milestones: ${biggestMilestones},
  Noticeable Press: ${noticeablePress}.
  Upcoming Dates: ${upcomingDates},`

let pressReleasePromptChatGpt2 = `
You are a professional music industry press release writer. Draft a high-quality press release for the artist **${name}**, using the following details:  

${artistDetail}

🎯 **OUTPUT FORMAT:**  
Return the result as a JSON object with this structure:  

{
  { "introduction": "One polished paragraph for the introduction." },
  { "background": "One polished paragraph for the background." },
  { "achievements": "One polished paragraph for the achievements." },
  { "quotes": "One polished paragraph for the quotes." },
  { "aboutTheArtist": "One polished paragraph for about the artist." },
  {"contactDetails": "the artist's contact details - email, social media profiles, *if known*" },
}

✅ **RULES:**  
- Each field must contain **exactly one paragraph**. No line breaks or multiple paragraphs.  
- Do NOT include any section labels, emojis, or decorative symbols in the text itself.  
- Write in a professional, polished, press-release tone.  
- Only use information from ${artistDetail}. If information for a section is missing, return an empty string for that key.  

⚠️ Return **only the JSON object**, nothing else.
`;




  console.log("Prompt in backend is: ", pressReleasePromptChatGpt2)

  

    //2 alt - openai press release generation
    const openaiPressRelease = await openai.chat.completions.create({
      model: "gpt-4", // or "gpt-3.5-turbo"
      messages: [
        { role: "user", content: pressReleasePromptChatGpt2}
    ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const openaiPressReleaseVersion = openaiPressRelease.choices[0].message.content;
    console.log("✅ openaiPressRelease alternative generated from openai:", openaiPressReleaseVersion);

    //Press release successfully generated!!
     passThrough.write(`pressRelease: ${openaiPressReleaseVersion}\n\n`); //return pressRelease to frontend once finished
    passThrough.end()

})

//server endpoint for font feature generation:
app.post("/fonts", upload.fields([{ name: "albumArtFiles", maxCount: 10 }, { name: "artistProfilePhotoFiles", maxCount: 10 },]), async (req, res) => { 


    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    res.flushHeaders();

    const encoder = new TextEncoder();
    const passThrough = new PassThrough();
    // Send initial connection message
    passThrough.pipe(res);
    passThrough.write('data: Pdf pipeline is open!!\n\n');




    console.log('Files:', req.files);         // array of uploaded files
  console.log('Text fields:', req.body);

  console.log("Album Art Files:", req.files.albumArtFiles); // array
    console.log("Press Photos Files:", req.files.artistProfilePhotoFiles); // array

  let { name, email, genre, targetAudience, socialPrescence, uniqueAngles, artistPersonalQuote, offstageDetailOrCause, primaryContactEmail, additionalLinks, keyInfluences, biggestMilestones, noticeablePress, upcomingDates, websiteUrl, trackList } = req.body;

console.log("name:", name);
console.log("email:", email);
console.log("genre:", genre);
console.log("targetAudience:", targetAudience);
console.log("socialPrescence:", socialPrescence);
console.log("uniqueAngles:", uniqueAngles);
console.log("artistPersonalQuote:", artistPersonalQuote);
console.log("offstageDetailOrCause:", offstageDetailOrCause);
console.log("primaryContactEmail:", primaryContactEmail);
console.log("additionalLinks:", additionalLinks);
console.log("keyInfluences:", keyInfluences);
console.log("biggestMilestones:", biggestMilestones);
console.log("noticeablePress:", noticeablePress);
console.log("upcomingDates:", upcomingDates);
console.log("websiteUrl:", websiteUrl);
console.log("trackList:", trackList);

let artistProfilePhotoFilesList = []
  let albumArtFilesList = []

  for (const file of req.files.albumArtFiles) {
    albumArtFilesList.push(file)
  }

  for (const file of req.files.artistProfilePhotoFiles) {
    artistProfilePhotoFilesList.push(file)
  }

  console.log("albumArtFilesList is: ", albumArtFilesList);
  console.log("artistProfilePhotoFilesList is: ", artistProfilePhotoFilesList)

  

  //let formattedTestTrackList = testTrackList.map((title, index) => `Track ${index}: ${title}`).join('\n')
  if (typeof trackList === 'string') {
    trackList = JSON.parse(trackList);
  }
  let formattedTrackList = trackList.map((title, index) => `Track ${index}: ${title}`).join('\n')



  console.log("value of formattedTrackList is: ", formattedTrackList)


  //1 - extracting image from frontend sent
  
  //add extraction of album art and artist profile pic

  if (!albumArtFilesList && artistProfilePhotoFilesList) {
    throw new Error("No uploaded albumArtFiles or artistProfilePhotoFiles found.");
  }

  //const base64Image = fs.readFileSync(uploadedImagePath, { encoding: 'base64' });

  let base64ImageURLCollection = []

  artistProfilePhotoFilesList.forEach((file) => {
    let base64Image = fs.readFileSync(file.path, { encoding: 'base64' });
    base64ImageURLCollection.push(`data:image/jpeg;base64,${base64Image}`)
  })

  albumArtFilesList.forEach((file) => {
    let base64Image = fs.readFileSync(file.path, { encoding: 'base64' });
    base64ImageURLCollection.push(`data:image/jpeg;base64,${base64Image}`)
  })

  console.log("value of base64ImageURLCollection is: ", base64ImageURLCollection);

  // Construct the OpenAI message content array
const imageContentArray = base64ImageURLCollection.map((url) => ({
  type: "image_url",
  image_url: {
    url: url
  }
}));

// Add a text prompt at the beginning
imageContentArray.unshift({
  type: "text",
  text: `Describe the aesthetics, mood, colors, fashion, and visual style of artist ${name} in these images. The aim is to use your generated specification to create a logo for the artist.`
});

  //2 - use gpt-vision language model to xtract details from the image:
  const visionResponse = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [
    {
      role: "system",
      content: "You are an assistant that analyzes visuals for artistic and thematic insights."
    },
    {
      role: "user",
      content: imageContentArray
    }
  ],
  max_tokens: 300
});

const visionDescriptionForLogo = visionResponse.choices[0].message.content;
console.log("🖼️ Vision insight for logo context:", visionDescriptionForLogo);
console.log("🖼️ The length of Vision insight for logo context is:", visionDescriptionForLogo.length)


function serializeFontCatalog(fontCatalog) {
  let text = 'Here is a list of available fonts:\n\n';
  for (const [category, fonts] of Object.entries(fontCatalog)) {
    text += `**${category}:**\n`;
    fonts.forEach(f => {
      text += `- ${f.name}: ${f.notes}\n`;
    });
    text += '\n';
  }
  return text;
}

//switched fontPrompt to use variables sent from frontend, rather than openAiPressReleaseAlternatuive, to save time from having to generate it
//can compare output from each to see if it affects quality

let fontPrompt = `Using the following information, recomened a font to be used for the Artist's Brand Guidelines:  Genre: ${genre},
  Target Audience: ${targetAudience},
  Social Prescence: ${socialPrescence},
  Unique Angles: ${uniqueAngles},
  Artist Personal Quote: ${artistPersonalQuote},
  Key Influences: ${keyInfluences},
  Biggest Milestones: ${biggestMilestones},
  Noticeable Press: ${noticeablePress}.
  Upcoming Dates: ${upcomingDates},
  Image Description: ${visionDescriptionForLogo}
.

The font should be one chosen from the following: ${serializeFontCatalog(fontCatalog)}. return your answer in the following format:

[
 { 
    "font": /font choice/,
    "explanation": /explanation of why you selected that font/
 }
]
`


const openaiFont = await openai.chat.completions.create({
      model: "gpt-4", // or "gpt-3.5-turbo"
      messages: [
        { role: "user", content: fontPrompt}
    ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const openaiFontReccomendation = openaiFont.choices[0].message.content;
    console.log("✅ openaiFontReccomendation generated from openai:", openaiFontReccomendation);

    let fontAnswer = JSON.parse(openaiFontReccomendation);
    console.log("fontAnswer is: ", fontAnswer);

    let brandGuide = {}
    brandGuide.fontAnswer = fontAnswer[0]
    let fontAnswerFinished = fontAnswer[0]

    //Font generated!
    passThrough.write(`fontAnswer: ${JSON.stringify(fontAnswerFinished)}\n\n`);
    passThrough.end()

})

//server endpoint for logo generation
app.post("/logos", upload.fields([{ name: "albumArtFiles", maxCount: 10 }, { name: "artistProfilePhotoFiles", maxCount: 10 },]), async (req, res) => { 


 res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Content-Type', 'text/event-stream');
    res.flushHeaders();

    
    

    const encoder = new TextEncoder();
    const passThrough = new PassThrough();
    // Send initial connection message
    passThrough.pipe(res);
    passThrough.write('data: Pdf pipeline is open!!\n\n');




    console.log('Files:', req.files);         // array of uploaded files
  console.log('Text fields:', req.body);

  console.log("Album Art Files:", req.files.albumArtFiles); // array
    console.log("Press Photos Files:", req.files.artistProfilePhotoFiles); // array

  let { name, email, genre, targetAudience, socialPrescence, uniqueAngles, artistPersonalQuote, offstageDetailOrCause, primaryContactEmail, additionalLinks, keyInfluences, biggestMilestones, noticeablePress, upcomingDates, websiteUrl, trackList } = req.body;

console.log("name:", name);
console.log("email:", email);
console.log("genre:", genre);
console.log("targetAudience:", targetAudience);
console.log("socialPrescence:", socialPrescence);
console.log("uniqueAngles:", uniqueAngles);
console.log("artistPersonalQuote:", artistPersonalQuote);
console.log("offstageDetailOrCause:", offstageDetailOrCause);
console.log("primaryContactEmail:", primaryContactEmail);
console.log("additionalLinks:", additionalLinks);
console.log("keyInfluences:", keyInfluences);
console.log("biggestMilestones:", biggestMilestones);
console.log("noticeablePress:", noticeablePress);
console.log("upcomingDates:", upcomingDates);
console.log("websiteUrl:", websiteUrl);
console.log("trackList:", trackList);

name = "Harry Lyon"
keyInfluences = 'His sound is a combination of all the best facets of pop– from Shawn Mendes’ synthy hooks to ‘80s nostalgia, his music captures the dynamism of indie pop'

let artistProfilePhotoFilesList = []
  let albumArtFilesList = []

  for (const file of req.files.albumArtFiles) {
    albumArtFilesList.push(file)
  }

  for (const file of req.files.artistProfilePhotoFiles) {
    artistProfilePhotoFilesList.push(file)
  }

  console.log("albumArtFilesList is: ", albumArtFilesList);
  console.log("artistProfilePhotoFilesList is: ", artistProfilePhotoFilesList)

  

  //let formattedTestTrackList = testTrackList.map((title, index) => `Track ${index}: ${title}`).join('\n')
  if (typeof trackList === 'string') {
    trackList = JSON.parse(trackList);
  }
  let formattedTrackList = trackList.map((title, index) => `Track ${index}: ${title}`).join('\n')



  console.log("value of formattedTrackList is: ", formattedTrackList)


  //1 - extracting image from frontend sent
  
  //add extraction of album art and artist profile pic

  if (!albumArtFilesList && artistProfilePhotoFilesList) {
    throw new Error("No uploaded albumArtFiles or artistProfilePhotoFiles found.");
  }

  //const base64Image = fs.readFileSync(uploadedImagePath, { encoding: 'base64' });

  let base64ImageURLCollection = []

  /*artistProfilePhotoFilesList.forEach((file) => {
    let base64Image = fs.readFileSync(file.path, { encoding: 'base64' });
    base64ImageURLCollection.push(`data:image/jpeg;base64,${base64Image}`)
  })*/
  //i'm going to blank this out here, as pictures of images likely affecting album outut

  albumArtFilesList.forEach((file) => {
    let base64Image = fs.readFileSync(file.path, { encoding: 'base64' });
    base64ImageURLCollection.push(`data:image/jpeg;base64,${base64Image}`)
  })

  console.log("value of base64ImageURLCollection is: ", base64ImageURLCollection);

  // Construct the OpenAI message content array
const imageContentArray = base64ImageURLCollection.map((url) => ({
  type: "image_url",
  image_url: {
    url: url
  }
}));

// Add a text prompt at the beginning
imageContentArray.unshift({
  type: "text",
  text: `Describe the aesthetics, mood, colors, fashion, and visual style of artist ${name} from these images of their album/albums. The aim is to use your generated specification to create social media assets (images for instagram posts) for the artist.`
});

  //2 - use gpt-vision language model to xtract details from the image:
  const visionResponse = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [
    {
      role: "system",
      content: "You are an assistant that analyzes visuals for artistic and thematic insights."
    },
    {
      role: "user",
      content: imageContentArray
    }
  ],
  max_tokens: 300
});

const visionDescriptionForLogo = visionResponse.choices[0].message.content;
console.log("🖼️ Vision insight for logo context:", visionDescriptionForLogo);
console.log("🖼️ The length of Vision insight for logo context is:", visionDescriptionForLogo.length)


let testLyrics = `i try so hard to change for you, but you treat me like a stranger, you talk like I'm a danger. I dont' have to justify the truth, i saw the best in you, there's nothing I can say, I have to walk away, I spent a lot of time stepping away`//get some harry lyon lyrics


//A short headline (max 6 words), Suggested caption with hashtags
/* get openai to generate ideas, before feeding ideas below */
const socialMediaIdeaPrompt = `
Based only on the following album images and visual description, generate three social media **visual design ideas** for ${name}’s upcoming album in the ${genre} genre.

album images: ${visionDescriptionForLogo}

**Constraints:**
- DO NOT include any people or images of Harry Lyon
- DO NOT include any text, words, font styles, or overlays
- DO NOT reference typography, titles, captions, or names
- DO NOT suggest "overlay areas", "font vibes", or text locations

Each idea should include:
- Suggested abstract background image style or crop
- Color palette reference
- Visual mood, texture, or emotional tone (purely visual, NO text or people)

Return your ideas strictly in the following JSON array format: 
[{ "idea1": "your first idea" }, { "idea2": "your second idea" }, { "idea3": "your third idea" }]
`;

//use this prompt to then send to another ipenai, to generate hashtags, and text, and title
//then return images with each 

const socialMediaIdeaPromptResponse = await generateSocialMediaIdeaPrompt(socialMediaIdeaPrompt)

console.log("socialMediaIdeaPromptResponse is: ", socialMediaIdeaPromptResponse);

//now pass openai generated array of social media designs



let options = 3
let artistLogoOptions = []

let logoPrompt = `You are a social media creator, designing social media posts for ${name}. Using the info from ${visionDescriptionForLogo}, design a social media post for them intended to be posted to instagram.`

//let socialMediaPrompt = `Using these artist assets (${visionDescriptionForLogo}), generate a captioned Instagram post image that reflect their style, color palette, and genre for ${name}. Do not include people or the artist ${name} in your design. *DO NOT INCLUDE TEXT* ${ genre ? ` take into account ${name}'s ${genre}`: ``}`



const socialMediaPrompt = `
Design an abstract, text-free, and faceless image inspired by the visual style of artist ${name}, based on these traits: ${visionDescriptionForLogo} ${testLyrics ? `, and the themes from a sample of his lyrics: ${testLyrics}` : ``}.

**Hard constraints**:
- Do NOT include any humans, faces, silhouettes, bodies, or figures.
- Do NOT include any letters, numbers, symbols, or logos.
- This is NOT a poster or flyer — no typography allowed.

Output a pure visual background suitable for social media, emphasizing only mood, texture, aesthetic, and color.
${genre ? `Incorporate abstract patterns or motifs from the ${genre} genre without depicting people or text.` : ``}
`;


let socialMediaIdeaPromptParsed = JSON.parse(socialMediaIdeaPromptResponse);


const truncatedLogoPrompt = socialMediaPrompt.length > 1000
  ? logoPrompt.slice(0, 997) + "..."
  : logoPrompt;





for (let x = 0; x < options; x++) {

    let idea = socialMediaIdeaPromptParsed[x]   
    console.log(`attempting to make logo no. ${x + 1}`)
    /*let finalPrompt = `generate this idea for a social media post: ${idea}. **Hard constraints**:
- Do NOT include any humans, faces, silhouettes, bodies, or figures.
- Do NOT include any letters, numbers, symbols, or logos.
- This is NOT a poster or flyer — no typography allowed.

Output a pure visual background suitable for social media, emphasizing only mood, texture, aesthetic, and color.`*/


//remove safness, regret, and replace with dynamic calling fo basket of adjectival thematic terms
let finalPrompt = `
Design a purely abstract visual inspired by this idea: ${JSON.stringify(idea)}, and some more themes: "Sadness", "Regret.

**Absolutely no exceptions**:
- Do NOT include text, words, letters, numbers, handwriting, or any form of symbols.
- Do NOT include people, body parts, silhouettes, musicians, figures, or any human shapes.
- Do NOT include logos, banners, overlays, or placeholder text elements.
- The image must NOT suggest text areas, headings, or artist name regions.
- This is NOT an album cover or poster — it is a **non-verbal ambient visual**.

Focus only on abstract shape, color, lighting, texture, and motion.
Output a 1024x1024 square image suitable for Instagram, with no recognizable elements.
`;

const truncatedfinalPrompt = finalPrompt.length > 1000
  ? finalPrompt.slice(0, 997) + "..."
  : finalPrompt;

  console.log("truncatedFinalPrompt is: ", truncatedfinalPrompt)

  let simplePrompt = `generate a abstract image based on the following genre: ${genre}, and the themes of: ${keyInfluences}`
  let simplePrompt2 = `Create a visual composition for a 2020s pop/rock singer-songwriter. 

**Rules**:
- Do NOT include any writing, letters, words, or numbers.
- Do NOT include people, faces, silhouettes, or figures.
- Do NOT simulate banners, buttons, or placeholder boxes.
- Focus entirely on visual elements: color, texture, mood, lighting, shapes.

The image must work as a background or atmospheric visual, not a poster or flyer.`

  const logoResult = await generateImage(truncatedfinalPrompt);
    //const logoResponse = generateLogo.choices[0].message.content;
    console.log(`✅ social media asset generated from openai:`, logoResult);

    /*const logoResult = await generateImage(truncatedLogoPrompt);
    //const logoResponse = generateLogo.choices[0].message.content;
    console.log(`✅ logoResult ${x + 1} generated from openai:`, logoResult);*/
    
    //append title, hastags, and text
    artistLogoOptions.push({ artistLogoOption:  [`${x + 1}`], url: logoResult}) //js objects only allow temperate literals for keys when in square brackets




console.log("the value of artistLogoOptions is: ", artistLogoOptions);
//brandGuide.artistLogoOptions = artistLogoOptions;

/* return artistLogoOptions */// passThrough.write(`artistLogoOptions: ${artistLogoOptions}\n\n`);

//3.3 - reccomend some colors





    let urlImageToCheckColor = artistLogoOptions[x].url
    console.log("urlImageToCheckColor is: ", urlImageToCheckColor);

    // Use OpenAI Vision model with the public image URL
const visionResponseColor = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [
    {
      role: "system",
      content: "You are an assistant that analyzes visuals for artistic and thematic insights. Avoid any parathetical comments in your response, focus purely on the task"
    },
    {
      role: "user",
      content: [
        {
          type: "text",
          text: "suggest colors that would work well with this logo design for the artist"
        },
        {
          type: "image_url",
          image_url: {
            url: urlImageToCheckColor // Publicly accessible URL
          }
        }
      ]
    }
  ],
  max_tokens: 300
});

const colorReccomendations = visionResponseColor.choices[0].message.content;
console.log(`🖼️ Color reccomendations for url ${x + 1}:`, colorReccomendations);

artistLogoOptions[x].colorsToReccomend = colorReccomendations;

console.log(`artistLogoOptions on attempt ${x} is: `, artistLogoOptions)

passThrough.write(`artistLogoOptions: ${JSON.stringify(artistLogoOptions)}\n\n`);


}
/* return */ //passThrough.write(`artistLogoOptions: ${JSON.stringify(artistLogoOptions)}\n\n`);


console.log("artistLogoOptions are adding colors reccomendations: ", artistLogoOptions);
passThrough.end()
})

//server endpoint for keywords generation:
app.post("/keywords", upload.fields([{ name: "albumArtFiles", maxCount: 10 }, { name: "artistProfilePhotoFiles", maxCount: 10 }]), async (req, res) => { 
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Content-Type', 'text/event-stream');
  res.flushHeaders();

  const passThrough = new PassThrough();
  passThrough.pipe(res);
  
  passThrough.write('data: Pdf pipeline is open!!\n\n');

  console.log('Files:', req.files);         // array of uploaded files
  console.log('Text fields:', req.body);

  console.log("Album Art Files:", req.files.albumArtFiles); // array
    console.log("Press Photos Files:", req.files.artistProfilePhotoFiles); // array

  let { name, email, genre, targetAudience, socialPrescence, uniqueAngles, artistPersonalQuote, offstageDetailOrCause, primaryContactEmail, additionalLinks, keyInfluences, biggestMilestones, noticeablePress, upcomingDates, websiteUrl, trackList } = req.body;

console.log("name:", name);
console.log("email:", email);
console.log("genre:", genre);
console.log("targetAudience:", targetAudience);
console.log("socialPrescence:", socialPrescence);
console.log("uniqueAngles:", uniqueAngles);
console.log("artistPersonalQuote:", artistPersonalQuote);
console.log("offstageDetailOrCause:", offstageDetailOrCause);
console.log("primaryContactEmail:", primaryContactEmail);
console.log("additionalLinks:", additionalLinks);
console.log("keyInfluences:", keyInfluences);
console.log("biggestMilestones:", biggestMilestones);
console.log("noticeablePress:", noticeablePress);
console.log("upcomingDates:", upcomingDates);
console.log("websiteUrl:", websiteUrl);
console.log("trackList:", trackList);

  try {
    // Your logs and destructuring here...

    // Prepare prompt
    //let keyWordsPhrasesPrompt = `You need to generate key words and/or phrases ...`;
    let keyWordsPhrasesPrompt = `You need to generate key words and/or phrases to describe ${name}.

Return in the form of an Array, with each phrase or keyword as a seperate entry. For example: ["great singer", "nice songs"]



You should use the info from the folowing in order to do so: Genre: ${genre},
  Target Audience: ${targetAudience},
  Social Prescence: ${socialPrescence},
  Unique Angles: ${uniqueAngles},
  Artist Personal Quote: ${artistPersonalQuote},
  Key Influences: ${keyInfluences},
  Biggest Milestones: ${biggestMilestones},
  Noticeable Press: ${noticeablePress}.
  Upcoming Dates: ${upcomingDates},
..

`

    const truncatedKeyWordsPhrasesPrompt = keyWordsPhrasesPrompt.length > 1000
      ? keyWordsPhrasesPrompt.slice(0, 997) + "..."
      : keyWordsPhrasesPrompt;

    const openaikeyWordsPhrases = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: truncatedKeyWordsPhrasesPrompt }],
      temperature: 0.7,
      max_tokens: 500,
    });

    const openaikeyWordsPhrasesAnswer = openaikeyWordsPhrases.choices[0].message.content;
    console.log("✅ openaikeyWordsPhrasesAnswer:", openaikeyWordsPhrasesAnswer);

    let openaiKeyWordsPhrasesAnswer = JSON.parse(openaikeyWordsPhrasesAnswer);

    //passThrough.write(`data: keyWordsPhrases: ${JSON.stringify(openaiKeyWordsPhrasesAnswer)}\n\n`);
    passThrough.write(`keyWordsPhrases: ${JSON.stringify(openaiKeyWordsPhrasesAnswer)}\n\n`);
    passThrough.end();

  } catch (error) {
    console.error("Error in /keywords endpoint:", error);
    passThrough.write(`data: error: ${error.message}\n\n`);
    passThrough.end();
  }
});

/*app.post("/keywords", upload.fields([{ name: "albumArtFiles", maxCount: 10 }, { name: "artistProfilePhotoFiles", maxCount: 10 },]), async (req, res) => { 
  

res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Content-Type', 'text/event-stream');
    res.flushHeaders();

    const encoder = new TextEncoder();
    const passThrough = new PassThrough();
    // Send initial connection message
    passThrough.pipe(res);
    passThrough.write('data: Pdf pipeline is open!!\n\n');




    console.log('Files:', req.files);         // array of uploaded files
  console.log('Text fields:', req.body);

  console.log("Album Art Files:", req.files.albumArtFiles); // array
    console.log("Press Photos Files:", req.files.artistProfilePhotoFiles); // array

  let { name, email, genre, targetAudience, socialPrescence, uniqueAngles, artistPersonalQuote, offstageDetailOrCause, primaryContactEmail, additionalLinks, keyInfluences, biggestMilestones, noticeablePress, upcomingDates, websiteUrl, trackList } = req.body;

console.log("name:", name);
console.log("email:", email);
console.log("genre:", genre);
console.log("targetAudience:", targetAudience);
console.log("socialPrescence:", socialPrescence);
console.log("uniqueAngles:", uniqueAngles);
console.log("artistPersonalQuote:", artistPersonalQuote);
console.log("offstageDetailOrCause:", offstageDetailOrCause);
console.log("primaryContactEmail:", primaryContactEmail);
console.log("additionalLinks:", additionalLinks);
console.log("keyInfluences:", keyInfluences);
console.log("biggestMilestones:", biggestMilestones);
console.log("noticeablePress:", noticeablePress);
console.log("upcomingDates:", upcomingDates);
console.log("websiteUrl:", websiteUrl);
console.log("trackList:", trackList);



//replacesed us of openaipressreleaelatrnative with simple variables from frontend, lets see if it affects relevance fo output?
let keyWordsPhrasesPrompt = `You need to generate key words and/or phrases to describe ${name}.

Return in the form of an Array, with each phrase or keyword as a seperate entry. For example: ["great singer", "nice songs"]



You should use the info from the folowing in order to do so: Genre: ${genre},
  Target Audience: ${targetAudience},
  Social Prescence: ${socialPrescence},
  Unique Angles: ${uniqueAngles},
  Artist Personal Quote: ${artistPersonalQuote},
  Key Influences: ${keyInfluences},
  Biggest Milestones: ${biggestMilestones},
  Noticeable Press: ${noticeablePress}.
  Upcoming Dates: ${upcomingDates},
..

`

const truncatedKeyWordsPhrasesPrompt = keyWordsPhrasesPrompt.length > 1000
  ? keyWordsPhrasesPrompt.slice(0, 997) + "..."
  : keyWordsPhrasesPrompt;

const openaikeyWordsPhrases = await openai.chat.completions.create({
      model: "gpt-4", // or "gpt-3.5-turbo"
      messages: [
        { role: "user", content: truncatedKeyWordsPhrasesPrompt}
    ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const openaikeyWordsPhrasesAnswer = openaikeyWordsPhrases.choices[0].message.content;
    console.log("✅ openaikeyWordsPhrasesAnswer generated from openai:", openaikeyWordsPhrasesAnswer);

    let openaiKeyWordsPhrasesAnswer = JSON.parse(openaikeyWordsPhrasesAnswer)

brandGuide.keyWordsPhrases = openaiKeyWordsPhrasesAnswer;
 passThrough.write(`keyWordsPhrases: ${JSON.stringify(brandGuide.keyWordsPhrases)}\n\n`);

passThrough.end();
})*/

app.post("/EDK", upload.fields([
  { name: "albumArtFiles", maxCount: 10 },
  { name: "artistProfilePhotoFiles", maxCount: 10 },
]), async (req, res) => {
  
    console.log("Album Art Files:", req.files.albumArtFiles); // array
    console.log("Press Photos Files:", req.files.artistProfilePhotoFiles); // array
    console.log("Other fields:", req.body); // for any text fields

    res.status(200).json({ message: "Files received!" });



})


app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));