import dotenv from "dotenv";
import { Request, Response } from "express";
import { fixDateIfInvalid } from "../utils/fixDateIfInvalid";

dotenv.config();

export async function GETCamps(
  req: Request<{
    parkId: string;
    checkin: string;
    checkout: string;
    adultCount: string;
    childrenCount: string;
    petCount: string;
    campsiteTypeId: string;
    environment: string;
  }>,
  res: Response
)

{
  console.log("All query parameters:", JSON.stringify(req.query));
  console.log("Environment parameter specifically:", req.query.environment);
  console.log("Type of environment:", typeof req.query.environment);

  let urlWithParams = "";

  // Get environment from query with fallback to staging
  console.log("Environment: ", req.query.environment);
  const environment = (req.query.environment as string) || "campspot-staging";

  const fetchAPI = async (url: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        return res
          .status(500)
          .json({ response: `Request failed with status ${response.status}` });
      }
      return await response.json();
    } catch (error) {
      console.error(error);
      throw new Error("Error fetching data");
    }
  };

  const fetchCampsiteInfo = async () => {
    const baseUrl =
      `https://insiderperks.com/wp-content/endpoints/${environment}/get-campsite-type.php`;
      console.log("Base URL in Get Camps: ", baseUrl);
    let params = {
      id: req.query.parkId,
      campsiteid: req.query.campsiteTypeId,
      checkin: req.query.checkin,
      checkout: req.query.checkout,
      adults: req.query.adultCount,
      children: req.query.childrenCount,
      pets: req.query.petCount,
      ...req.query,
    };

    const dateFixesPromises = await Promise.all([
      fixDateIfInvalid(params.checkin as string),
      fixDateIfInvalid(params.checkout as string),
    ]);
    params.checkin = dateFixesPromises[0];
    params.checkout = dateFixesPromises[1];

    let checkinDate = new Date(params.checkin as string);
    if (checkinDate.getUTCDate() === 1) {
      checkinDate.setUTCHours(checkinDate.getUTCHours() + 7, 0, 7);
      params.checkin = checkinDate.toISOString();
    }

    const queryString = Object.keys(params)
      .map(
        (key: string) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(
            params[key as keyof typeof params] as string
          )}`
      )
      .join("&");
    
    urlWithParams = `${baseUrl}?${queryString}`;

    console.log("Fetching campsite data from: ", urlWithParams);
    
    try {
      const jsonResponse = await fetchAPI(urlWithParams);
      if (
        !jsonResponse ||
        !jsonResponse.campsites ||
        jsonResponse.campsites.length === 0
      ) {
        return JSON.stringify({ response: "No results found." });
      }

      const { campsites, name: siteName, pricing, smartPricing } = jsonResponse;
      const breakDownPrice = smartPricing;
      const siteLockFee = pricing.feeSummary.lockFee;
      const siteType = (req.query.parkId as string)?.toLowerCase();
      const filteredCampsites = campsites
        .filter((campsite: any) => campsite.availability === "AVAILABLE")
        .map((campsite: any) => ({
          id: campsite.id,
          mapId: campsite.mapId,
          siteName,
          name: campsite.name,
          siteLockFee,
          ...(siteType === "rv" ? { rvInfo: campsite.rvInfo } : {}),
        }));

      return JSON.stringify({
        filteredCampsites: filteredCampsites.length ? filteredCampsites : [],
        siteLockFee,
        breakDownPrice,
      });
    } catch {
      return JSON.stringify({ response: "Error fetching campsite data" });
    }
  };

  const toolResponse = await fetchCampsiteInfo();
  const toolResponseObj = JSON.parse(toolResponse);

  const fetchVision = async (url: string, options: any) => {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(error);
      throw new Error("Error fetching assistant data");
    }
  };

  // const fetchAssistantResponse = async () => {
  //   const baseUrl = "https://api.openai.com/v1/chat/completions";
  //   const availableCamps = toolResponseObj?.filteredCampsites;
  //   const site = availableCamps?.[0]?.siteName;
  //   const pID = req.query.parkId;

  //   console.log("Checking for available camps of site: ", site);

  //   const siteMapUrl = `https://insiderperks.com/wp-content/endpoints/${environment}/sitemaps/${pID}.png`;

  //   const prompt = `Role: 
  //   You are an assistant helping a potential guest book their site by describing the locations of the ${site} sites at the resort. They cannot see the map, 
  //   but you have access to it. Do not describe the location by saying phrases like "it is the blue legend on the map". You are on a phone call conversation 
  //   with the user, so ensure that your description is clear, informative, and concise (not too short, not too long, just enough for the user to understand 
  //   the location).
  
  //   Main Task:
  //   Describe the location of the Site ${site} based on the resort map. For example, tell the user if any of these sites are close to notable features like 
  //   rivers, swimming pools, or playgrounds. Do not mention anything about the map itself, such as colors or icons. Focus on key information that can help 
  //   the user make a decision based on the site’s proximity to resort features. Keep your response concise and informative, it will be used on a phonecall. 
  
  //   You have access to the site map at: ${siteMapUrl}.
    
  //   Make sure to add the IDS and NAMES (3 digits) of the camps based on the site map. Here is a JSON string of the details, be sure to include the IDS and NAMES (3 digits), those are required: 
  //   ${JSON.stringify(availableCamps)}`;

  //   const headers = {
  //     "Content-Type": "application/json",
  //     Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
  //   };

  //   const requestBody = {
  //     model: "gpt-4o",
  //     messages: [{ role: "user", content: prompt }],
  //     max_tokens: 300,
  //   };

  //   try {
  //     const jsonResponse = await fetchVision(baseUrl, {
  //       method: "POST",
  //       headers,
  //       body: JSON.stringify(requestBody),
  //     });

  //     if (jsonResponse.choices && jsonResponse.choices.length > 0) {
  //       return JSON.stringify({
  //         response: jsonResponse.choices[0].message.content.replace(/"/g, ""),
  //       });
  //     }
  //   } catch {
  //     return JSON.stringify({ response: "Error fetching assistant response" });
  //   }

  //   return JSON.stringify({ response: "No response from assistant." });
  // };

  // const response2 = await fetchAssistantResponse();

  return res.status(200).json({ summarizedCamps: 'empty', availableCamps: toolResponseObj, urlEndpoint: urlWithParams });
}
