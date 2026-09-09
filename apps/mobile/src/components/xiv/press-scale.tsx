import { type ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

type Props = PressableProps & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function PressScale({ children, style, disabled, ...rest }: Props) {
  const reduceMotion = useReducedMotion();
  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [
        style,
        pressed && !disabled
          ? reduceMotion
            ? { opacity: 0.92 }
            : { opacity: 0.88, transform: [{ scale: 0.985 }] }
          : null,
      ]}
      {...rest}>
      {children}
    </Pressable>
  );
}
