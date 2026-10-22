import { InteractiveStation, StallSimState, StationId } from '../types/game';

export const INTERACTIVE_STATIONS: InteractiveStation[] = [
  {
    id: 'stove',
    title: 'Kerosene / Gas Stove (Chula)',
    bengaliTitle: 'চুলা • Stove Burner',
    worldPos: [-1.55, 1.25, -0.8],
    interactionRadius: 1.55,
    getActionLabel: (s) => (s.stoveLit ? 'Turn Off Stove Flame' : 'Ignite Stove Burner'),
    getSubPrompt: (s) =>
      s.stoveLit
        ? 'Flame is active and heating the aluminum kettle'
        : 'Light the burner to boil water and brew milk tea',
  },
  {
    id: 'kettle',
    title: 'Aluminum Tea Kettle (Cha-er Ketli)',
    bengaliTitle: 'চায়ের কেতলি • Metal Kettle',
    worldPos: [-1.12, 1.32, -0.78],
    interactionRadius: 1.55,
    getActionLabel: (s) => {
      if (s.heldItem === 'kettle') return 'Place Kettle Back on Stove';
      return 'Pick Up Kettle to Pour Cha';
    },
    getSubPrompt: (s) => {
      if (s.heldItem === 'kettle') return 'Carrying hot kettle — approach Glass Cups to pour';
      if (!s.stoveLit) return 'Ignite the stove first so the kettle stays piping hot';
      return `Hot Liquor Ready (${Math.round(s.teaBrewLevel)}% brewed) — pick up to pour into glass cups`;
    },
  },
  {
    id: 'cups',
    title: 'Glass Tea Cups & Condensed Milk',
    bengaliTitle: 'চায়ের কাপ • Glass Tea Cups',
    worldPos: [-0.25, 1.22, -0.78],
    interactionRadius: 1.55,
    getActionLabel: (s) => {
      if (s.heldItem === 'kettle') {
        return s.cupsFilledCount < 6
          ? 'Pour Steaming Dudh Cha into Cup'
          : 'All 6 Glass Cups Filled (Return Kettle)';
      }
      if (s.heldItem === 'filled_cup') {
        return 'Set Glass Cup Back on Tray';
      }
      if (s.cupsFilledCount > 0) {
        return 'Pick Up Hot Glass of Dudh Cha';
      }
      return 'Pick Up Kettle First to Pour Tea';
    },
    getSubPrompt: (s) =>
      `${s.cupsFilledCount} / 6 glass cups filled with warm condensed-milk tea`,
  },
  {
    id: 'biscuits',
    title: 'Glass Biscuit Jars (Boiyam)',
    bengaliTitle: 'বিস্কুটের বয়াম • Biscuit Jars',
    worldPos: [0.52, 1.28, -0.78],
    interactionRadius: 1.55,
    getActionLabel: (s) => {
      if (s.heldItem === 'biscuit') return 'Return Toast Biscuit to Jar';
      if (s.biscuitsRemaining > 0) return 'Take Crispy Toast Biscuit';
      return 'Refill Glass Biscuit Jars';
    },
    getSubPrompt: (s) =>
      `${s.biscuitsRemaining} crispy toast biscuits inside the glass boiyam jars`,
  },
  {
    id: 'counter',
    title: 'Customer Serving Counter',
    bengaliTitle: 'গ্রাহক কাউন্টার • Customer Counter',
    worldPos: [0.25, 1.18, -0.45],
    interactionRadius: 1.65,
    getActionLabel: (s) => {
      if (s.heldItem === 'filled_cup') return 'Serve Hot Glass of Cha to Customer';
      if (s.heldItem === 'biscuit') return 'Serve Toast Biscuit to Customer';
      if (s.heldItem === 'kettle') return 'Pour Direct Cha Refill for Customer';
      return 'Greet Customer / Wipe Wooden Counter';
    },
    getSubPrompt: (s) =>
      s.heldItem === 'none'
        ? `Pick up a filled tea cup or biscuit to serve (${s.customersServed} served)`
        : 'Press E to hand item to the waiting roadside customer',
  },
];

export function executeStationInteraction(
  stationId: StationId,
  prev: StallSimState
): StallSimState {
  const next = { ...prev };

  switch (stationId) {
    case 'stove': {
      next.stoveLit = !prev.stoveLit;
      next.kettleBoiling = next.stoveLit;
      next.lastActionToast = next.stoveLit
        ? 'Ignited kerosene/gas stove burner — kettle is simmering.'
        : 'Turned off the stove burner flame.';
      return next;
    }

    case 'kettle': {
      if (prev.heldItem === 'kettle') {
        next.heldItem = 'none';
        next.lastActionToast = 'Placed aluminum kettle back onto the stove grate.';
      } else {
        next.heldItem = 'kettle';
        next.lastActionToast =
          'Picked up the hot aluminum kettle. Walk to the Glass Tea Cups and press E to pour.';
      }
      return next;
    }

    case 'cups': {
      if (prev.heldItem === 'kettle') {
        if (prev.cupsFilledCount < 6) {
          next.cupsFilledCount = prev.cupsFilledCount + 1;
          next.lastActionToast = `Poured steaming Dudh Cha into glass cup (${next.cupsFilledCount}/6 filled).`;
        } else {
          next.heldItem = 'none';
          next.lastActionToast = 'All 6 glass cups are full! Returned kettle to stove.';
        }
        return next;
      }
      if (prev.heldItem === 'filled_cup') {
        next.heldItem = 'none';
        next.cupsFilledCount = Math.min(6, prev.cupsFilledCount + 1);
        next.lastActionToast = 'Placed glass tea cup back on the serving tray.';
        return next;
      }
      if (prev.cupsFilledCount > 0) {
        next.cupsFilledCount = prev.cupsFilledCount - 1;
        next.heldItem = 'filled_cup';
        next.lastActionToast =
          'Picked up a hot glass cup of Dudh Cha. Approach the Customer Counter and press E to serve.';
        return next;
      }
      next.lastActionToast =
        'No filled cups on the tray! Pick up the Kettle first and pour tea into a cup.';
      return next;
    }

    case 'biscuits': {
      if (prev.heldItem === 'biscuit') {
        next.heldItem = 'none';
        next.biscuitsRemaining = Math.min(16, prev.biscuitsRemaining + 1);
        next.lastActionToast = 'Returned toast biscuit to the glass jar.';
        return next;
      }
      if (prev.biscuitsRemaining > 0) {
        next.biscuitsRemaining = prev.biscuitsRemaining - 1;
        next.heldItem = 'biscuit';
        next.lastActionToast =
          'Took a crispy toast biscuit from the jar. Serve it at the Customer Counter with E.';
        return next;
      }
      next.biscuitsRemaining = 16;
      next.lastActionToast = 'Restocked both glass jars with 16 fresh toast biscuits.';
      return next;
    }

    case 'counter': {
      if (prev.heldItem === 'filled_cup') {
        next.heldItem = 'none';
        next.customersServed = prev.customersServed + 1;
        next.lastActionToast =
          'Served steaming Dudh Cha! "আহ্, চমৎকার মালাই চা!" (Customer loved the tea)';
        return next;
      }
      if (prev.heldItem === 'biscuit') {
        next.heldItem = 'none';
        next.customersServed = prev.customersServed + 1;
        next.lastActionToast =
          'Served crispy toast biscuit to the customer at the counter!';
        return next;
      }
      if (prev.heldItem === 'kettle') {
        next.customersServed = prev.customersServed + 1;
        next.lastActionToast = 'Poured a hot top-up of Lal Cha for the roadside regular!';
        return next;
      }
      next.lastActionToast =
        'Wiped down the wooden counter and greeted customers. Pick up a tea cup or biscuit to serve!';
      return next;
    }
  }
}
