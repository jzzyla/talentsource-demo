import {test, expect} from '@playwright/test';

async function ready(page){
  await page.goto('/');
  await expect(page.locator('#status')).toHaveText('Models ready. Predictions stay in this browser.');
}

test('estimates update automatically, explain units, validate, and recover',async({page})=>{
  await ready(page);
  await expect(page.locator('#inputs input')).toHaveCount(11);
  await expect(page.getByRole('spinbutton',{name:'Alcohol % vol.',exact:true})).toHaveValue('10.1');
  await expect(page.locator('#help-10')).toHaveText('Alcohol by volume; enter 12 for 12%.');
  await expect(page.locator('#inputs label').filter({hasText:'mg/L'})).toHaveCount(2);
  await expect(page.locator('#score')).toHaveText('5.73');
  await page.locator('#input-10').fill('12');
  await expect(page.locator('#score')).toHaveText('6.03');
  await page.locator('#input-0').fill('');
  await expect(page.locator('#score')).toHaveText('—');
  await expect(page.locator('#interpretation')).toContainText('Complete all measurements');
  await page.locator('#reset').click();
  await page.locator('#input-10').fill('30');
  await expect(page.locator('#range-warning')).toBeVisible();
  await page.locator('#reset').click();
  await expect(page.locator('#range-warning')).toBeHidden();
  await expect(page.locator('#score')).toHaveText('5.73');
});

test('numeric overflow clears the score, prevents saving, and recovers',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await ready(page);
  await page.locator('#model').selectOption('ridge');
  for(const input of await page.locator('#inputs input').all())await input.fill(String(Number.MAX_VALUE));
  await expect(page.locator('#score')).toHaveText('—');
  await expect(page.locator('#interpretation')).toContainText('too large');
  await expect(page.locator('#marker')).toBeHidden();
  await page.locator('#save-a').click();
  await expect(page.locator('#save-status')).toContainText('Profile not saved');
  await page.locator('#model').selectOption('forest');
  await expect(page.locator('#score')).toHaveText('—');
  await page.locator('#reset').click();
  await expect(page.locator('#score')).toHaveText('5.73');
  expect(errors).toEqual([]);
});

test('compares saved snapshots, changes models, edits and removes profiles',async({page})=>{
  await ready(page);
  await page.locator('#wine-name').fill('First lot');
  await page.locator('#save-a').click();
  await page.locator('#input-10').fill('12');
  await page.locator('#wine-name').fill('Second lot');
  await page.locator('#save-b').click();
  await page.locator('#input-10').fill('13'); // Saved B must stay at 12.
  await page.locator('#open-compare').click();
  await expect(page.locator('#compare-measurements tr')).toHaveCount(11);
  await expect(page.locator('.measurement-changed')).toHaveCount(1);
  const alcohol=page.locator('#compare-measurements tr').filter({hasText:'alcohol'});
  await expect(alcohol).toContainText('% vol.');
  await expect(alcohol.locator('td').nth(1)).toHaveText('12');
  await expect(page.locator('#compare-summary')).toContainText('Wine B has a higher estimated score by 0.30');
  await page.locator('#compare-model').selectOption('baseline');
  await expect(page.locator('#compare-summary')).toContainText('same estimated score');
  await page.locator('#wine-cards').getByRole('button',{name:'Edit profile'}).first().click();
  await expect(page.locator('#input-10')).toHaveValue('10.1');
  await expect(page.locator('#wine-name')).toHaveValue('First lot');
  await page.locator('#tab-compare').click();
  await page.getByRole('button',{name:'Remove Wine A'}).click();
  await expect(page.locator('#measurement-comparison')).toBeHidden();
  await expect(page.locator('#compare-summary')).toContainText('Save both wines');
});

test('keyboard navigation, evidence, and page width work at both sizes',async({page})=>{
  await ready(page);
  await page.locator('#tab-predict').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#tab-evidence')).toBeFocused();
  await expect(page.locator('#evidence')).toBeVisible();
  await expect(page.locator('#split')).toContainText('Random seed: 42');
  await expect(page.locator('#metrics tr')).toHaveCount(3);
  await page.keyboard.press('End');
  await expect(page.locator('#compare')).toBeVisible();
  await page.keyboard.press('Home');
  await expect(page.locator('#predict')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('a missing model produces an explicit loading error',async({page})=>{
  await page.route('**/models/forest.json',route=>route.fulfill({status:404,body:'Missing model'}));
  await page.goto('/');
  await expect(page.locator('#status')).toContainText('Unable to start: Could not load ./models/forest.json: 404');
  await expect(page.locator('#score')).toHaveText('—');
});
