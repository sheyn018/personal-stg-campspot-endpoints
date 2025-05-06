// Define an interface for the query parameters
interface AddCartQuery {
  parkId: string;
  siteLocationLocked: string;
  email: string;
  campsiteTypeId: string;
  checkin: string;
  checkout: string;
  adultCount: string;
  childrenCount: string;
  petCount: string;
  rvCategory: string;
  rvSlideout_value: string;
  rvSlideout_label: string;
  rvType: string;
  rvLength: string;
  promoCode: string;
  userSite: string;
}

import { Request, Response } from "express";
import { langchainLlm } from "../utils/LangchainStep";
import { fixDateIfInvalid } from "../utils/fixDateIfInvalid";

export async function GETAddCart(
  req: Request<{}, {}, {}, AddCartQuery>,
  res: Response
) {
  try {
    let { 
      parkId, 
      siteLocationLocked,
      email,
      campsiteTypeId,
      checkin,
      checkout,
      adultCount,
      childrenCount,
      petCount,
      rvCategory,
      rvSlideout_value,
      rvSlideout_label,
      rvType,
      rvLength,
      promoCode,
      userSite,
      environment,
    } = req.query;

    // Convert string values to appropriate types
    const parsedAdultCount = parseInt(adultCount);
    const parsedChildrenCount = parseInt(childrenCount);
    const parsedPetCount = parseInt(petCount);

    // Decoding the variables
    parkId = decodeURIComponent(parkId);
    email = decodeURIComponent(email);
    campsiteTypeId = decodeURIComponent(campsiteTypeId);
    checkin = decodeURIComponent(checkin);
    checkout = decodeURIComponent(checkout);
    rvCategory = decodeURIComponent(rvCategory);
    rvSlideout_value = decodeURIComponent(rvSlideout_value);
    rvSlideout_label = decodeURIComponent(rvSlideout_label);
    rvType = decodeURIComponent(rvType);
    rvType = rvType.charAt(0).toUpperCase() + rvType.slice(1);

    rvLength = decodeURIComponent(rvLength);
    promoCode = decodeURIComponent(promoCode);
    userSite = decodeURIComponent(userSite);

    console.log("Environment Add Cart: ", req.query.environment);
    environment = decodeURIComponent(environment) || "campspot-staging";

    if (rvCategory !== 'lodging' && rvCategory !== 'rv') {
      if (rvType === '0' && rvLength === '0' && rvSlideout_value === '0' && rvSlideout_label === '0') { 
        rvCategory = 'lodging';
      } else {
        rvCategory = 'rv';
      }
    }

    const queryPara = {
      parkId: parkId,
      campsiteTypeId: campsiteTypeId,
      checkin: checkin,
      checkout: checkout,
      adultCount: parsedAdultCount,
      childrenCount: parsedChildrenCount,
      petCount: parsedPetCount,
      userSite: userSite,
    };

    // Call rebook function first
    const baseUrl = `https://insiderperks.com/wp-content/endpoints/${environment}/rebook-cart.php`;

    interface RebookParams {
      email: string;
      promoCode: string;
      [key: string]: string;
    }

    const rebookParams: RebookParams = {
      email,
      promoCode: promoCode || '',
    };

    const queryString = Object.keys(rebookParams)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(rebookParams[key])}`)
      .join('&');

    const urlWithParams = `${baseUrl}?${queryString}`;

    const fetchOptions = {
      method: 'POST',
    };

    const rebook = await fetch(urlWithParams, fetchOptions);
    const rebookString = await rebook.text();

    const findCampsite = async (dynamicParams: Partial<typeof queryPara> = {}): Promise<string | null> => {
      const params = { ...queryPara, ...dynamicParams };
      console.log('Rebook String: ', rebookString);
      const userSite = params.userSite;
      const getCamps = `https://insiderperks.com/wp-content/endpoints/${environment}/get-campsite-type.php`;
      
      const campsParams: Record<string, string | number> = {
        id: params.parkId ?? 0,
        campsiteid: params.campsiteTypeId ?? 0  ,
        checkin: params.checkin ?? "",
        checkout: params.checkout ?? "",
        adults: params.adultCount ?? 0,
        children: params.childrenCount ?? 0,
        pets: params.petCount ?? 0,
      };
      
      // Adjust checkin date if necessary
      let checkinDate = new Date(campsParams.checkin as string);
      
      if (checkinDate.getUTCDate() === 1) {
        checkinDate.setUTCHours(checkinDate.getUTCHours() + 7);
        checkinDate.setUTCMinutes(0);
        checkinDate.setUTCSeconds(7);
        campsParams.checkin = checkinDate.toISOString();
      }
      
      // Convert the parameters to a query string
      const queryString = Object.entries(campsParams)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
      
      // Append the query string to the URL
      const urlWithParams = `${getCamps}?${queryString}`;
      
      let jsonResponse;
      
      try {
        jsonResponse = await fetch(urlWithParams);
      } catch (error) {
        console.error('An error occurred while fetching the campsite data.');
        return null;
      }

      let data;

      try {
        data = await jsonResponse.json();
      } catch (error) {
        console.error('Failed to parse JSON response.');
        return null;
      }

      if (!data || !data.campsites || data.campsites.length === 0) {
        console.log('No results found.');
        return null;
      }
      
      // Find the campsite in the results based on the user site
      const campsites: Array<{ availability: string; name: string; id: string }> = data.campsites;
      const selectedCampsite = campsites.find(campsite => {
        console.log(`Checking campsite: ${campsite.name}, Availability: ${campsite.availability}, Location ID: ${campsite.id}`);
        console.log(`User site: ${userSite}`);
        console.log(`Campsite name: ${campsite.name}`);
        return campsite.availability === "AVAILABLE" && String(campsite.name) === String(userSite);
      });
      
      if (selectedCampsite) {
        console.log(`Adding campsite ${selectedCampsite.id} to the cart...`);
        return selectedCampsite.id; // Return the campsite ID
      } 
      
      else {
        console.log('No campsite found.');
        return null;
      }
    };

    // Existing code for saving customer details
    const addCartUrl = `https://insiderperks.com/wp-content/endpoints/${environment}/add-cart.php`;
    const campsiteId = await findCampsite();
    let slideOutValue: string, slideOutLabel: string;
  
    if (rvSlideout_label.toLowerCase() === 'driver side' || rvSlideout_value === '1') {
      slideOutValue = '1';
      slideOutLabel = 'Driver Side';
    }
    else if (rvSlideout_label.toLowerCase() === 'both sides' || rvSlideout_value === '2') {
      slideOutValue = '2';
      slideOutLabel = 'Both Sides';
    }
    else {
      slideOutValue = '0';
      slideOutLabel = 'None';
    }
    
    const customerData = {
        parkId: parkId,
        siteLocationLocked: siteLocationLocked,
        email: email,
        campsiteId: campsiteId,
        campsiteTypeId: campsiteTypeId,
        checkin: checkin,
        checkout: checkout,
        adultCount: adultCount,
        childrenCount: childrenCount,
        petCount: petCount,
        rvCategory : rvCategory.toLowerCase(),
        rvSlideout_value: rvSlideout_value,
        rvSlideout_label: rvSlideout_label,
        rvType: rvType,
        rvLength: rvLength,
    };

    console.log(customerData);
    const addCartString = JSON.stringify(customerData);

    let status = 'failed';
    let details;

    try {
      const response = await fetch(addCartUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json',
        },
        body: addCartString
      });
      details = await response.json();
      console.log(details);

      // Check if there's an error and expand the errors array
      if (details.status === 'error' && details.message_log?.error?.errors) {
        console.log('Detailed error information:');
        details.message_log.error.errors.forEach((error: any, index: any) => {
            console.log(`Error ${index + 1}:`, error);
        });
      }

      if (response.ok) {
        status = "success";
      } else {
        status = "failed";
      }
    } 
    
    catch (error: any) {
      status = error.message;
    }

    return res.send({ details });
  } 
  
  catch (error: any) {
    return res.status(500).send("Error processing the request");
  }
}
