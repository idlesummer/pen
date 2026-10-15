import React, {useState} from 'react';
import {Box, Text, useApp, useInput} from 'ink';

export type WelcomeItem = {
	label: string;
	value: string;
	hint?: string;
};

export type WelcomeProps = {
	name?: string;
	version?: string;
	tagline?: string;
	items?: WelcomeItem[];
	onSelect?: (item: WelcomeItem) => void;
};

const defaultItems: WelcomeItem[] = [
	{label: 'Create a new project', value: 'new', hint: 'scaffold from a template'},
	{label: 'Start dev server', value: 'dev', hint: 'hot reload on :3000'},
	{label: 'Read the docs', value: 'docs', hint: 'opens in your browser'},
	{label: 'Quit', value: 'quit'},
];

export default function Welcome({
	name = 'your-framework',
	version = '0.0.0',
	tagline = 'Build something good.',
	items = defaultItems,
	onSelect,
}: WelcomeProps) {
	const {exit} = useApp();
	const [index, setIndex] = useState(0);

	useInput((input, key) => {
		if (key.upArrow || input === 'k') {
			setIndex(i => (i - 1 + items.length) % items.length);
		} else if (key.downArrow || input === 'j') {
			setIndex(i => (i + 1) % items.length);
		} else if (key.return) {
			const item = items[index]!;
			if (item.value === 'quit') {
				exit();
			} else {
				onSelect?.(item);
			}
		} else if (input === 'q') {
			exit();
		}
	});

	return (
		<Box flexDirection="column" paddingX={1} paddingY={1}>
			<Box
				flexDirection="column"
				borderStyle="round"
				borderColor="cyan"
				paddingX={2}
				paddingY={1}
			>
				<Box gap={1}>
					<Text color="cyan" bold>
						◆ {name}
					</Text>
					<Text dimColor>v{version}</Text>
				</Box>
				<Text dimColor>{tagline}</Text>
			</Box>

			<Box flexDirection="column" marginTop={1} marginLeft={1}>
				{items.map((item, i) => {
					const active = i === index;
					return (
						<Box key={item.value} gap={1}>
							<Text color="cyan">{active ? '❯' : ' '}</Text>
							<Text color={active ? 'cyan' : undefined} bold={active}>
								{item.label}
							</Text>
							{active && item.hint ? <Text dimColor>{item.hint}</Text> : null}
						</Box>
					);
				})}
			</Box>

			<Box marginTop={1} marginLeft={1}>
				<Text dimColor>↑/↓ move · enter select · q quit</Text>
			</Box>
		</Box>
	);
}

/*
Usage (cli.tsx):

	import React from 'react';
	import {render} from 'ink';
	import Welcome from './Welcome.js';

	render(
		<Welcome
			name="myframework"
			version="0.1.0"
			tagline="The meta-framework for ..."
			onSelect={item => console.log(item.value)}
		/>,
	);

Requires: ink, react (ESM project, "jsx": "react-jsx" or React in scope).
*/
