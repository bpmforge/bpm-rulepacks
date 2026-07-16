class MyService {
  constructor(private dep: Dep) {}
  doThing() {
    return this.dep.doThing();
  }
}
