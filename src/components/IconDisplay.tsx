import { CategoryIcon } from '../types';
import { 
  Skull, Ghost, Eye, Flame, Moon, Zap, Cloud, Heart, Star, 
  Shield, Compass, Anchor, Feather, Music, Camera, Book, PenTool, 
  Code, Globe, Rocket, Mountain, TreePine, Sun, Umbrella, Key, 
  Lock, Bell, Clock, MapPin, Flag, Gift, Gem, Wind, Droplet, 
  Sparkles, Bug, Brain, Swords, Crown, ScrollText, Wand2, 
  Triangle, Hexagon, Aperture, Castle
} from 'lucide-react';

export function IconDisplay({ icon, className = "h-[1em] w-[1em]" }: { icon: CategoryIcon; className?: string }) {
  const iconMap: Record<CategoryIcon, any> = {
    skull: Skull, ghost: Ghost, eye: Eye, flame: Flame, moon: Moon,
    zap: Zap, cloud: Cloud, heart: Heart, star: Star, shield: Shield,
    compass: Compass, anchor: Anchor, feather: Feather, music: Music, camera: Camera,
    book: Book, pen: PenTool, code: Code, globe: Globe, rocket: Rocket,
    mountain: Mountain, tree: TreePine, sun: Sun, umbrella: Umbrella, key: Key,
    lock: Lock, bell: Bell, clock: Clock, map: MapPin, flag: Flag,
    gift: Gift, gem: Gem, wind: Wind, droplet: Droplet, sparkles: Sparkles,
    bug: Bug, brain: Brain, swords: Swords, crown: Crown, scroll: ScrollText,
    wand: Wand2, bat: Triangle, spider: Hexagon,
    castle: Castle, aperture: Aperture, 'tree-pine': TreePine,
  };
  
  const IconComponent = iconMap[icon] || Ghost;
  // If className doesn't specify height/width, we add it to inherit font size
  const finalClassName = className?.includes('h-') ? className : `h-[1em] w-[1em] ${className || ''}`;
  return <IconComponent className={finalClassName.trim()} />;
}
