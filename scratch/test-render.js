import { pathwayConfig } from '../src/config/pathway.config.js';

// Mock translation function
const t = (key) => key || '';

const renderInputMockup = (item) => {
    switch (item.type) {
        case 'yes_no':
            return 'yes_no_mockup';
        case 'slider_0_10':
            return 'slider_mockup';
        case 'rating':
            return 'rating_mockup';
        case 'scale':
            return 'scale_mockup';
        case 'select':
            return 'select_mockup';
        case 'text':
        case 'textarea':
            return 'text_mockup';
        default:
            return null;
    }
};

const runTest = () => {
    console.log("Starting render test of pathwayConfig...");
    const keys = Object.keys(pathwayConfig);
    console.log("Tabs in config:", keys);

    for (const key of keys) {
        console.log(`\n--- Testing Tab: ${key} ---`);
        const config = pathwayConfig[key];
        if (!config) {
            console.log(`Config for ${key} is empty!`);
            continue;
        }

        console.log(`Title: ${config.title}`);
        console.log(`Subtitle: ${config.subtitle}`);
        
        try {
            config.sections.forEach(section => {
                console.log(`  Section ID: ${section.id}, Title: ${section.title}`);
                section.items.forEach(item => {
                    console.log(`    Item ID: ${item.id}, Type: ${item.type}`);
                    
                    // Test t(item.label)
                    const label = t(item.label);
                    
                    // Test renderInputMockup(item)
                    const mockup = renderInputMockup(item);
                    
                    // Test t(item.why || item.info_text)
                    const why = t(item.why || item.info_text);
                    
                    // Test risk flag rendering logic
                    if (item.risk_flag_rule) {
                        const ruleType = item.risk_flag_rule.type;
                        const ruleCond = item.risk_flag_rule.condition;
                        const isHard = ruleType === 'hard';
                        const text = `Alerte ${isHard ? 'hard' : 'soft'} si ${ruleCond}`;
                    }
                });
            });
            console.log(`Tab ${key} rendered successfully!`);
        } catch (err) {
            console.error(`Error rendering Tab ${key}:`, err);
        }
    }
    console.log("\nFinished render test.");
};

runTest();
