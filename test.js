const API_URL = 'https://hackatime.hackclub.com/api/hackatime/v1/users/current/heartbeats';
const API_KEY = 'c31551b9-4b0f-493e-b05d-910b4a447604';

const pulse = async () => {
    const payload = {
        entity: "app.js",
        type: "file",
        project: "uptimepage",
        language: "JavaScript",
        category: "coding",
        time: Date.now() / 1000,
        is_write: true
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.status === 201 || response.status === 202) {
            console.log(`[${new Date().toLocaleTimeString()}] Pulso aceito.`);
        } else {
            console.log(`[${new Date().toLocaleTimeString()}] Status: ${response.status}`);
        }
    } catch (err) {
        console.error('Falha na conexão:', err.message);
    }
};

setInterval(pulse, 35000);
pulse();