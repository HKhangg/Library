"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Heart, Star, Cloud, Moon } from "lucide-react"; 

const FloatingIcons = () => {
  const [icons, setIcons] = useState([]);

  useEffect(() => {
    const allIcons = [Heart, Star, Cloud, Moon]; 

    const randomIcons = Array.from({ length: 35 }).map(() => ({
      id: Math.random(),
      icon: allIcons[Math.floor(Math.random() * allIcons.length)],
      left: Math.random() * 100, 
      size: 10 + Math.random() * 28, 
      duration: 10 + Math.random() * 10, 
      delay: Math.random() * 8, 
    }));

    setIcons(randomIcons);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {icons.map((item) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={item.id}
            initial={{ y: "110vh", opacity: 0 }}
            animate={{
              y: ["110vh", "-10vh"],
              opacity: [0, 1, 0],
              rotate: [0, 15, -15, 0],
            }}
            transition={{
              duration: item.duration,
              delay: item.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              position: "absolute",
              left: `${item.left}%`,
            }}
          >
            <Icon
              size={item.size}
              strokeWidth={1.3}
              className="text-[#16a9c7] opacity-80" 
            />
          </motion.div>
        );
      })}
    </div>
  );
};

export default FloatingIcons;
