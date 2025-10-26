export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    let trackingNumber = '';
    try {
        trackingNumber = request.body.number;
        if (!trackingNumber) {
            throw new Error('no tracking number provided!');
        }
    } catch (e) {
        return response.status(400).json({ error: 'your requests content was invalid.' });
    }

    const apiKey = process.env.TRACKING_API_KEY;
    if (!apiKey) {
        console.error("no API key provided.");
        return response.status(500).json({ error: 'server go brrrr.' });
    }

    const registerEndpoint = "https://api.17track.net/track/v1/register";
    const getInfoEndpoint = "https://api.17track.net/track/v2.4/gettrackinfo";

    try {
        console.log(`Registering tracking number: ${trackingNumber}`);
        const registerResponse = await fetch(registerEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                '17token': apiKey
            },
            body: JSON.stringify([ { "number": trackingNumber } ])
        });

        if (!registerResponse.ok) {
            const errorData = await registerResponse.json().catch(() => ({}));
            throw new Error(errorData?.data?.errors?.[0]?.message || 'failed to register that package');
        }

        const registerData = await registerResponse.json();
        if (registerData.code !== 0) {
             throw new Error(`failed to register: ${registerData.message || 'unknown register error'}`);
        }
        if (registerData.data.rejected.length > 0) {
            throw new Error(`registration rejected: ${registerData.data.rejected[0].error.message}`);
        }
        const getInfoResponse = await fetch(getInfoEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                '17token': apiKey
            },
            body: JSON.stringify([ { "number": trackingNumber } ])
        });

        if (!getInfoResponse.ok) {
            console.error(`an error occured when requesting the info from 17TRACK: ${getInfoResponse.status}: ${getInfoResponse.statusText}`);
             const errorData = await getInfoResponse.json().catch(() => ({}));
            throw new Error(errorData?.data?.errors?.[0]?.message || 'failed to get the actual tracking data');
        }
        const infoData = await getInfoResponse.json();
        if (infoData.code !== 0) {
             throw new Error(`failure fetching tracking data: ${infoData.message || 'unknown error fetching tracking data'}`);
        }
        if (infoData.data.rejected.length > 0) {
            throw new Error(`rejection fetching tracking data: ${infoData.data.rejected[0].error.message}`);
        }
        if (infoData.data.accepted.length === 0) {
            throw new Error("the tracking data isn't yet avalaible. you should try again in a few seconds...");
        }
        return response.status(200).json(infoData);
    } catch (error) {
        return response.status(500).json({ error: error.message || 'something bad happened.' });
    }
}