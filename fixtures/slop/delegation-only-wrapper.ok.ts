class MyService {
  constructor(private dep: Dep) {}
  doThing(id: string) {
    const raw = this.dep.doThing(id);
    return normalize(raw);
  }
}
