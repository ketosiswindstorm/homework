export class SimpleTag {
  public label: string = '';
  public value: string = '';
}

export class Tag {
  public type: number = 0;
  public count: number = 0;
  public name: string = '';
  public ambiguous: boolean = false;
  public id: number = 0;

  public static fromXML(el: Element){
    return {
      type: Number(el.getAttribute('type') || 0),
      id: Number(el.getAttribute('id') || 0),
      name: el.getAttribute('name') || '',
      ambiguous: el.getAttribute('ambiguous') === 'true',
      count: Number(el.getAttribute('count') || 0),
    };
  }
}
