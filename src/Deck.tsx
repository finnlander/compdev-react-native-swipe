import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Animated, Dimensions, LayoutAnimation, PanResponder, PanResponderInstance, Platform, StyleSheet, UIManager, View, ViewStyle } from 'react-native';

const SCREEN_WIDTH = Dimensions.get("screen").width;
const SWIPE_THRESHOLD = SCREEN_WIDTH / 4;
const SWIPE_ANIM_DURATION = 250;

enum Direction {
  LEFT = 'left',
  RIGHT = 'right'
};

export interface Item {
  id: number;
  text: string;
  uri: string;
}

interface Props {
  renderCard: (item: Item) => JSX.Element;
  renderNoMoreCards: () => JSX.Element;
  data: Item[];
  onSwipeRight?: (item: Item) => void;
  onSwipeLeft?: (item: Item) => void;
}

const Deck = (props: Props) => {
  const { data, renderCard, renderNoMoreCards, onSwipeRight, onSwipeLeft } = props;

  const [index, setIndex] = useState(0);
  const position = useRef(new Animated.ValueXY()).current;

  const _onSwipeComplete = (item: Item, direction: Direction) => {
    const callback = direction === Direction.RIGHT ? onSwipeRight : onSwipeLeft;
    if (callback) {
      callback(item);
    }
    setIndex(i => i + 1);
    position.setValue({ x: 0, y: 0 });
  }

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (e, gesture) => position.setValue({ x: gesture.dx, y: gesture.dy }),
    onPanResponderRelease: (e, gesture) => {
      if (gesture.dx > SWIPE_THRESHOLD) {
        // swipe right
        swipe(position, data[index], Direction.RIGHT, _onSwipeComplete);
      } else if (gesture.dx < -SWIPE_THRESHOLD) {
        // swipe left
        swipe(position, data[index], Direction.LEFT, _onSwipeComplete);
      }
      else {
        resetPosition(position)
      }
    }

  })).current;

  const _renderCards = () => {
    if (index >= data.length) {
      return renderNoMoreCards();
    }

    return data.map((item, i) => i < index
      ? null
      : (<DeckItem
        key={item.id}
        item={item}
        itemIndex={i}
        topItemIndex={index}
        position={position}
        renderCard={renderCard}
        panResponder={panResponder} />)
    );
  };

  useLayoutEffect(() => {
    // Add animation to move card deck up smoothly when a card is discarded
    UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);
    LayoutAnimation.spring();

  }, [index]);

  useEffect(() => {
    setIndex(0);
  }, [data]);

  return (
    <View>
      {_renderCards()}
    </View>
  );
};

export default Deck;

/* Styles */
const styles = StyleSheet.create({
  cardStyle: {
    /* Note: the absolute positioning breaks panhandling on Android */
    position: Platform.OS === 'ios' ? 'absolute' : 'relative',
    width: SCREEN_WIDTH,

  }
});

/* Sub-component: DeckItem */

interface DeckItemProps {
  itemIndex: number;
  topItemIndex: number;
  item: Item;
  position: Animated.ValueXY;
  panResponder: PanResponderInstance;
  renderCard: (item: Item) => JSX.Element;

}
const DeckItem = (props: DeckItemProps) => {
  const { itemIndex, topItemIndex, item, position, panResponder, renderCard } = props;
  const isOnTop = itemIndex === topItemIndex;

  if (isOnTop) {
    return (
      <Animated.View key={item.id} style={[getCardStyle(position), styles.cardStyle, getZIndex(itemIndex)]} {...panResponder.panHandlers}>
        {renderCard(item)}
      </Animated.View>
    )
  }

  return (
    <Animated.View
      key={item.id}
      style={[styles.cardStyle, , getZIndex(itemIndex), { top: (itemIndex - topItemIndex) * 5 }]}>
      {renderCard(item)}
    </Animated.View>
  );
}

/* Helper Functions */

function swipe(position: Animated.ValueXY, item: Item, direction: Direction, onComplete: (item: Item, direction: Direction) => void) {

  const x = direction === Direction.RIGHT ? SCREEN_WIDTH + 100 : -SCREEN_WIDTH - 100;
  Animated.timing(position, {
    toValue: {
      x,
      y: 0
    },
    duration: SWIPE_ANIM_DURATION,
    useNativeDriver: false
  }).start(() => onComplete(item, direction));
}

function resetPosition(position: Animated.ValueXY) {
  Animated.spring(position, {
    toValue: {
      x: 0,
      y: 0
    },
    useNativeDriver: false,
  }).start();
}

function getCardStyle(position: Animated.ValueXY): ViewStyle {

  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH * 2, 0, SCREEN_WIDTH * 2],
    outputRange: ['-120deg', '0deg', '120deg']
  });

  return {
    ...position.getLayout(),
    transform: [{
      rotate: rotate as unknown as string
    }]
  };
}

function getZIndex(itemIndex: number): ViewStyle {
  return {
    zIndex: Platform.select({
      ios: -1 * itemIndex,
      android: undefined
    }),
    elevation: Platform.select({
      ios: undefined,
      android: -1 * itemIndex
    })
  }
}