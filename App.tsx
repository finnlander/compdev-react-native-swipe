import { StatusBar } from 'expo-status-bar';
import faker from 'faker';
import 'isomorphic-fetch';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Card } from 'react-native-elements';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Deck, { Item } from './src/Deck';

export default function App() {

  const [data, setData] = useState<Item[]>([]);

  useEffect(() => {
    seq = 0;
    generateData().then(setData);
  }, [])

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <SafeAreaView edges={['top', 'bottom']}>
          <View style={{ marginBottom: 20 }} />
          <Deck
            data={data}
            renderCard={(item) => <CardItem item={item} />}
            renderNoMoreCards={() => (<FetchCard onMoreItemsAvailable={setData} />)}
          />
        </SafeAreaView>
        <StatusBar style="auto" />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  text: {
    marginVertical: 10,
    lineHeight: 16,
    fontSize: 14,
    minHeight: 32,
  }
});

/* Helper Functions */
async function generateData(): Promise<Item[]> {
  const data = await Promise.all([1, 2, 3, 4, 5, 6, 7, 8].map(async _ => await generateItem()));
  return data.sort((a, b) => a.id - b.id);
}

let seq = 0;
async function generateItem(): Promise<Item> {
  const res = await fetch('https://picsum.photos/1280/1024');
  const id = seq++;
  return {
    id: id,
    text: faker.lorem.sentence(),
    uri: res.url
  }
}

/* Sub-component: CardItem */
interface CardItemProps {
  item: Item
}
const CardItem = ({ item }: CardItemProps) => {

  return (
    <Card key={item.id} >
      <Card.Title>{`Card #${item.id + 1}`}</Card.Title>
      <Card.Image source={{
        uri: item.uri,
      }} />
      <Text style={styles.text} numberOfLines={2}>
        {item.text}
      </Text>
      <Button icon={{ name: 'code' }} buttonStyle={{ backgroundColor: '#03A9F4' }} title="View Now!" />
    </Card>
  );
}

/* Sub-component: FetchCard */
interface FetchCardProps {
  onMoreItemsAvailable: (items: Item[]) => void;
}
const FetchCard = ({ onMoreItemsAvailable }: FetchCardProps) => {
  return (
    <Card key="FetchCard">
      <Card.Title>All Done!</Card.Title>
      <Card.Divider />
      <Text style={styles.text}>(No more cards)</Text>
      <Button title="Get more!" onPress={async () => {
        const moreData = await generateData();
        onMoreItemsAvailable(moreData);
      }} />
    </Card>
  );
}