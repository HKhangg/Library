import { useCallback, useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim"; 

const ParticlesBackground = () => {
    const [ init, setInit ] = useState(false);
    useEffect(() => {
        initParticlesEngine(async (engine) => {
            await loadSlim(engine);
        }).then(() => {
            setInit(true);
        });
    }, []);

    const particlesLoaded = (container) => {
        console.log(container);
    };
    // xem thêm options config tại : https://particles.js.org/docs/interfaces/tsParticles_Engine.Options_Interfaces_IOptions.IOptions.html
    // preset mẫu: https://particles.js.org/samples/presets/index.html
    // options preset: https://github.com/tsparticles/presets/tree/main/presets
    return (
         init && <Particles
            id="tsparticles"
            particlesLoaded={particlesLoaded}
            options={{
                fullscreen: true,
                background: {
                    color: "transparent",
                },
                fpsLimit: 120,
                interactivity: {
                    events: {
                        onClick: {
                            enable: true,
                            mode: "push",
                        },
                        onHover: {
                            enable: true,
                            mode: "repulse",
                        },
                        resize: true,
                    },
                    modes: {
                        push: {
                            quantity: 4,
                        },
                        repulse: {
                            distance: 200,
                            duration: 0.4,
                        },
                    },
                },
                particles: {
                    number: {
                        value: 70,
                    },
                    color: {
                        value: ["#3998D0", "#2EB6AF", "#A9BD33", "#FEC73B", "#F89930", "#F45623", "#D62E32", "#EB586E", "#9952CF"],
                    },
                    shape: {
                        type: "circle",
                    },
                    opacity: {
                        value: { min: 0.4, max: 0.8 },
                    },
                    size: {
                        value: { min: 10, max: 50 },
                    },
                    move: {
                        enable: true,
                        angle: {
                            value: 45,
                            offset: 0,
                        },
                        speed: 2,
                        direction: "none",
                        outModes: {
                            default: "bounce",
                        },
                    },
                },
                detectRetina: true,
            }}
        />
)
    ;
};

export default ParticlesBackground;