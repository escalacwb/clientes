import React from "react";
import Svg, { Circle, Ellipse, Line, Path, Rect } from "react-native-svg";

type IconProps = {
  color: string;
  size?: number;
  strokeWidth?: number;
};

export function EyeOpenIcon({ color, size = 20, strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2 12C4.2 7.7 7.7 5.5 12 5.5C16.3 5.5 19.8 7.7 22 12C19.8 16.3 16.3 18.5 12 18.5C7.7 18.5 4.2 16.3 2 12Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={strokeWidth} />
    </Svg>
  );
}

export function EyeClosedIcon({ color, size = 20, strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2 12C4.2 7.7 7.7 5.5 12 5.5C16.3 5.5 19.8 7.7 22 12C19.8 16.3 16.3 18.5 12 18.5C7.7 18.5 4.2 16.3 2 12Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line
        x1="4"
        y1="20"
        x2="20"
        y2="4"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function CadastroIcon({ color, size = 20, strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="3.5" width="14" height="17" rx="2.5" stroke={color} strokeWidth={strokeWidth} />
      <Line x1="8" y1="9" x2="16" y2="9" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1="8" y1="13" x2="16" y2="13" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1="8" y1="17" x2="13" y2="17" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

function AlocarIcon({ color, size = 20, strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3.5" y="5" width="8" height="8" rx="1.5" stroke={color} strokeWidth={strokeWidth} />
      <Rect x="12.5" y="11" width="8" height="8" rx="1.5" stroke={color} strokeWidth={strokeWidth} />
      <Path d="M11.5 9H14.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M14.5 9L13 7.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14.5 9L13 10.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function FilasIcon({ color, size = 20, strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="6.5" cy="7" r="1" fill={color} />
      <Circle cx="6.5" cy="12" r="1" fill={color} />
      <Circle cx="6.5" cy="17" r="1" fill={color} />
      <Line x1="9" y1="7" x2="19" y2="7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1="9" y1="12" x2="19" y2="12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1="9" y1="17" x2="19" y2="17" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

function BoxesIcon({ color, size = 20, strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="7" height="7" rx="1.5" stroke={color} strokeWidth={strokeWidth} />
      <Rect x="13" y="4" width="7" height="7" rx="1.5" stroke={color} strokeWidth={strokeWidth} />
      <Rect x="4" y="13" width="7" height="7" rx="1.5" stroke={color} strokeWidth={strokeWidth} />
      <Rect x="13" y="13" width="7" height="7" rx="1.5" stroke={color} strokeWidth={strokeWidth} />
    </Svg>
  );
}

function ConcluidosIcon({ color, size = 20, strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Ellipse cx="12" cy="12" rx="9" ry="9" stroke={color} strokeWidth={strokeWidth} />
      <Path
        d="M8 12.5L10.8 15.3L16.5 9.7"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function FeedbackIcon({ color, size = 20, strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 5.5C4 4.4 4.9 3.5 6 3.5H18C19.1 3.5 20 4.4 20 5.5V13.5C20 14.6 19.1 15.5 18 15.5H10L6 19V15.5H6C4.9 15.5 4 14.6 4 13.5V5.5Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="8" y1="8" x2="16" y2="8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1="8" y1="11.5" x2="13" y2="11.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

function RevisaoIcon({ color, size = 20, strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 13C6 9.7 8.7 7 12 7C14.2 7 16.1 8.2 17.1 10"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M18 7V10.5H14.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M18 11C18 14.3 15.3 17 12 17C9.8 17 7.9 15.8 6.9 14"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M6 17V13.5H9.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function HomeIcon({ color, size = 20, strokeWidth = 1.8 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 11.5L12 4.5L20 11.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6.5 10.5V19.5H17.5V10.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M10 19.5V14H14V19.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

type TabIconProps = {
  routeName: string;
  color: string;
  size?: number;
};

export function TabIcon({ routeName, color, size = 20 }: TabIconProps) {
  if (routeName === "Home") return <HomeIcon color={color} size={size} />;
  if (routeName === "Cadastro") return <CadastroIcon color={color} size={size} />;
  if (routeName === "Alocar") return <AlocarIcon color={color} size={size} />;
  if (routeName === "Filas") return <FilasIcon color={color} size={size} />;
  if (routeName === "Boxes") return <BoxesIcon color={color} size={size} />;
  if (routeName === "Feedback") return <FeedbackIcon color={color} size={size} />;
  if (routeName === "Revisao") return <RevisaoIcon color={color} size={size} />;
  return <ConcluidosIcon color={color} size={size} />;
}
